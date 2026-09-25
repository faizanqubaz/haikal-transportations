import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

const BookingSchema = new Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

    passengerCnic: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{5}-\d{7}-\d{1}$/,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
      lowercase: true,
      trim: true,
    },

    route: {
      type: String,
      required: true,
      trim: true,
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
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalFare: {
      type: Number,
      required: true,
      min: 0,
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

const Booking =
  models.Booking ||
  model("Booking", BookingSchema);

export default Booking;