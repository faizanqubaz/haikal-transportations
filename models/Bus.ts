import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBus extends Document {
  busNumber: string;
  company: string;
  driverPhone?: string;

  route?: string;

  pickup: string;
  dropoff: string;

  date: string;

  departure: string;
  arrival: string;
  duration: string;

  price: number;

  image?: string;

  seats: {
    seatNumber: string;
    status: "available" | "pending" | "booked";
  }[];
}

const SeatSchema = new Schema(
  {
    seatNumber: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "pending", "booked"],
      default: "available",
    },
  },
  { _id: false }
);

const BusSchema = new Schema<IBus>(
  {
    busNumber: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    driverPhone: {
      type: String,
      trim: true,
    },

    route: {
      type: String,
      trim: true,
    },

    pickup: {
      type: String,
      required: true,
      trim: true,
    },

    dropoff: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    departure: {
      type: String,
      required: true,
    },

    arrival: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
    },

    seats: {
      type: [SeatSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Bus: Model<IBus> =
  mongoose.models.Bus || mongoose.model<IBus>("Bus", BusSchema);

export default Bus;