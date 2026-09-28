const cloudinary = require("../config/cloudinary");

// Sends an in-memory image buffer to Cloudinary and resolves with the
// public HTTPS URL, which is what we store in MongoDB.
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "clinic-doctors" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

module.exports = uploadToCloudinary;