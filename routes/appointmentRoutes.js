const express = require("express");

const {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createAppointment);

router.get("/my", getMyAppointments);

// Admin-only: full list, needed to manage/act on any appointment.
router.get("/", roleMiddleware("admin"), getAllAppointments);

router.get("/:id", getAppointmentById);

router.patch("/:id/cancel", cancelAppointment);

router.patch("/:id/status", roleMiddleware("admin"), updateAppointmentStatus);

router.delete("/:id", roleMiddleware("admin"), deleteAppointment);

module.exports = router;