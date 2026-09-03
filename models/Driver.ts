import mongoose, { Schema, models, model } from "mongoose";

const DriverSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    assignedBus: { type: Schema.Types.ObjectId, ref: "Bus" },
  },
  { timestamps: true }
);

export default models.Driver || model("Driver", DriverSchema);
