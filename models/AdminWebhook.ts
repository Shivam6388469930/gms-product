import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminWebhook extends Document {
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  failureCount: number;
  lastTriggeredAt?: Date;
  lastStatusCode?: number;
  lastErrorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminWebhookSchema = new Schema<IAdminWebhook>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    events: {
      type: [String],
      default: ["respondent.complete", "respondent.screenout"],
    },
    secret: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    lastTriggeredAt: {
      type: Date,
    },
    lastStatusCode: {
      type: Number,
    },
    lastErrorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const AdminWebhook: Model<IAdminWebhook> =
  mongoose.models.AdminWebhook ||
  mongoose.model<IAdminWebhook>("AdminWebhook", AdminWebhookSchema);

export default AdminWebhook;
