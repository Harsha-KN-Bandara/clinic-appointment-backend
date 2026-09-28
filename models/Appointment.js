// const mongoose = require("mongoose");

// const appointmentSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },

//     doctorId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Doctor",
//       required: true
//     },

//     appointmentDate: {
//       type: Date,
//       required: true
//     },

//     timeSlot: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     status: {
//       type: String,
//       enum: [
//         "Pending",
//         "Confirmed",
//         "Cancelled",
//         "Completed"
//       ],
//       default: "Pending"
//     }
//   },
//   {
//     timestamps: true
//   }
// );

// module.exports = mongoose.model("Appointment", appointmentSchema);

const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },

    appointmentDate: {
      type: Date,
      required: true
    },

    timeSlot: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Cancelled",
        "Completed"
      ],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);