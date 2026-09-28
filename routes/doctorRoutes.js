const express = require("express");

const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getDoctors);
router.get("/:id", getDoctorById);

// Auth and role checks run first — reject early before ever touching
// the filesystem via multer. authMiddleware only reads the Authorization
// header, so it doesn't need the body to be parsed first.
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  createDoctor
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  updateDoctor
);

router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDoctor);

module.exports = router;