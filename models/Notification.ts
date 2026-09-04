import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["booking"],
      default: "booking",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Notification ||
  mongoose.model(
    "Notification",
    NotificationSchema
  );