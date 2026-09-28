const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { getDayRange } = require("../utils/dateUtils");

const ACTIVE_STATUSES = ["Pending", "Confirmed"];

const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        message: "Doctor, appointment date and time slot are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const dayRange = getDayRange(appointmentDate);

    if (!dayRange) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    if (dayRange.end < new Date()) {
      return res.status(400).json({
        message: "Appointment date cannot be in the past",
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({ message: "Doctor is currently unavailable" });
    }

    // Business rule: block booking once the doctor's daily capacity
    // for this specific date is reached. Always recalculated live so
    // it can never drift out of sync, unlike a stored counter would.
    const currentCount = await Appointment.countDocuments({
      doctorId,
      appointmentDate: { $gte: dayRange.start, $lte: dayRange.end },
      status: { $in: ACTIVE_STATUSES },
    });

    if (currentCount >= doctor.dailyCapacity) {
      return res.status(400).json({ message: "Doctor is fully booked for today" });
    }

    const duplicatePatient = await Appointment.findOne({
      userId: req.user.id,
      doctorId,
      appointmentDate: { $gte: dayRange.start, $lte: dayRange.end },
      timeSlot,
      status: { $in: ACTIVE_STATUSES },
    });

    if (duplicatePatient) {
      return res.status(400).json({
        message: "You already have an appointment for this time slot",
      });
    }

    const slotTaken = await Appointment.findOne({
      doctorId,
      appointmentDate: { $gte: dayRange.start, $lte: dayRange.end },
      timeSlot,
      status: { $in: ACTIVE_STATUSES },
    });

    if (slotTaken) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    const appointment = await Appointment.create({
      userId: req.user.id,
      doctorId,
      appointmentDate,
      timeSlot,
      status: "Pending",
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("userId", "name email")
      .populate("doctorId", "name specialization consultationFee dailyCapacity image");

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id })
      .populate("doctorId", "name specialization consultationFee image")
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-only: list every appointment in the system.
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("userId", "name email")
      .populate("doctorId", "name specialization consultationFee image")
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate("userId", "name email")
      .populate("doctorId", "name specialization consultationFee image");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role === "patient" &&
      appointment.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You can only view your own appointments",
      });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role === "patient" &&
      appointment.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You can only cancel your own appointments",
      });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        message: "Completed appointments cannot be cancelled",
      });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const { status } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Cancelled", "Completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate("userId", "name email")
      .populate("doctorId", "name specialization consultationFee image");

    res.json({ message: "Appointment status updated", appointment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin-only: hard delete (e.g. removing test data), distinct from a
// patient's soft "Cancelled" status change above.
const deleteAppointment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};