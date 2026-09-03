import mongoose, { Schema, models, model } from "mongoose";

const BookingSchema = new Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
    },

    passengerName: {
      type: String,
      required: true,
      trim: true,
    },

    passengerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    passengerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    route: {
      type: String,
      required: true,
    },

    bus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },

    // Multiple seats can be selected in one booking
    seats: {
      type: [String],
      required: true,
    },

    travelDate: {
      type: Date,
      required: true,
    },

    travelTime: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },

    emailScheduledAt: {
      type: Date,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    whatsappSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Booking || model("Booking", BookingSchema);