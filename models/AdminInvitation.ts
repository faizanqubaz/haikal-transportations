import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminInvitation extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const AdminInvitationSchema = new Schema<IAdminInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB automatically removes the invitation after expiry.
AdminInvitationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AdminInvitation: Model<IAdminInvitation> =
  mongoose.models.AdminInvitation ||
  mongoose.model<IAdminInvitation>(
    "AdminInvitation",
    AdminInvitationSchema
  );

export default AdminInvitation;