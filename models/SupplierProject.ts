import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplierProject extends Document {
  supplierCode: string;
  projectId: string;
  title: string;
  clientName: string;
  audience: "consumer" | "b2b" | "healthcare";
  country: string;
  sampleRequired: number;
  sampleDelivered: number;
  cpi: number;
  totalValue: number;
  loi: number;
  ir: number;
  status: "incoming" | "active" | "paused" | "completed";
  receivedDate: string;
  deadlineDate: string;
  surveyUrlTemplate: string;
  qualityScoreRequired: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierProjectSchema = new Schema<ISupplierProject>(
  {
    supplierCode: {
      type: String,
      default: "SUP_APEX",
      required: true,
      index: true,
      trim: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      required: true,
      enum: ["consumer", "b2b", "healthcare"],
      index: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    sampleRequired: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
    sampleDelivered: {
      type: Number,
      default: 0,
      min: 0,
    },
    cpi: {
      type: Number,
      required: true,
      default: 5.0,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      default: 500,
    },
    loi: {
      type: Number,
      default: 10,
    },
    ir: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ["incoming", "active", "paused", "completed"],
      default: "incoming",
      index: true,
    },
    receivedDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    deadlineDate: {
      type: String,
      default: () => new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    },
    surveyUrlTemplate: {
      type: String,
      default: "",
    },
    qualityScoreRequired: {
      type: Number,
      default: 80,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

SupplierProjectSchema.index({ supplierCode: 1, projectId: 1 }, { unique: true });

const SupplierProject: Model<ISupplierProject> =
  mongoose.models.SupplierProject ||
  mongoose.model<ISupplierProject>("SupplierProject", SupplierProjectSchema);

export default SupplierProject;
