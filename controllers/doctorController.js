const Doctor = require("../models/Doctor");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// Shared validation for create/update — catches bad types and values
// before anything reaches the database.
const validateDoctorInput = (data, isUpdate = false) => {
  const errors = [];
  const { name, specialization, consultationFee, dailyCapacity } = data;

  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      errors.push("Name is required and must be a non-empty string");
    }
  }

  if (!isUpdate || specialization !== undefined) {
    if (
      !specialization ||
      typeof specialization !== "string" ||
      !specialization.trim()
    ) {
      errors.push("Specialization is required and must be a non-empty string");
    }
  }

  if (!isUpdate || consultationFee !== undefined) {
    const fee = Number(consultationFee);
    if (consultationFee === undefined || Number.isNaN(fee) || fee < 0) {
      errors.push("Consultation fee must be a number of 0 or more");
    }
  }

  if (!isUpdate || dailyCapacity !== undefined) {
    const capacity = Number(dailyCapacity);
    if (
      dailyCapacity === undefined ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      errors.push("Daily capacity must be a whole number greater than 0");
    }
  }

  return errors;
};

const parseIsAvailable = (isAvailable) => {
  if (isAvailable === undefined) return true;
  return isAvailable === "true" || isAvailable === true;
};

const createDoctor = async (req, res) => {
  try {
    const validationErrors = validateDoctorInput(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const { name, specialization, consultationFee, dailyCapacity, isAvailable } =
      req.body;

    // Image goes to Cloudinary; we store the returned public URL.
    const imageUrl = req.file ? await uploadToCloudinary(req.file.buffer) : null;

    const doctor = await Doctor.create({
      name: name.trim(),
      specialization: specialization.trim(),
      consultationFee: Number(consultationFee),
      dailyCapacity: Number(dailyCapacity),
      isAvailable: parseIsAvailable(isAvailable),
      image: imageUrl,
    });

    res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const validationErrors = validateDoctorInput(req.body, true);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const { name, specialization, consultationFee, dailyCapacity, isAvailable } =
      req.body;

    if (name !== undefined) doctor.name = name.trim();
    if (specialization !== undefined) doctor.specialization = specialization.trim();
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
    if (dailyCapacity !== undefined) doctor.dailyCapacity = Number(dailyCapacity);
    if (isAvailable !== undefined) doctor.isAvailable = parseIsAvailable(isAvailable);
    if (req.file) doctor.image = await uploadToCloudinary(req.file.buffer);

    await doctor.save();

    res.json({
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};