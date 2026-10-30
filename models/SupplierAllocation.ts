import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/Project";
import "@/models/User";
import "@/models/Supply";

export interface ISupplierAllocation extends Document {
  project: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  supplierCode: string;
  supply?: mongoose.Types.ObjectId;
  allocatedSample: number;
  allocatedCpi: number;
  routingPercent: number;
  priority: number;
  status: "incoming" | "active" | "paused" | "completed";
  actualStarts: number;
  actualCompletes: number;
  actualTerminates: number;
  actualQuotaFull: number;
  actualSpend: number;
  surveyUrlTemplate: string;
  allocatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierAllocationSchema = new Schema<ISupplierAllocation>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    supplierCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    supply: {
      type: Schema.Types.ObjectId,
      ref: "Supply",
      index: true,
    },
    allocatedSample: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    allocatedCpi: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    routingPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["incoming", "active", "paused", "completed"],
      default: "active",
      index: true,
    },
    actualStarts: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualCompletes: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualTerminates: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualQuotaFull: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    surveyUrlTemplate: {
      type: String,
      default: "",
      trim: true,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SupplierAllocationSchema.index({ project: 1, supplierId: 1 }, { unique: true });
SupplierAllocationSchema.index({ supplierId: 1, status: 1 });
SupplierAllocationSchema.index({ supplierCode: 1, status: 1 });

const SupplierAllocation: Model<ISupplierAllocation> =
  mongoose.models.SupplierAllocation ||
  mongoose.model<ISupplierAllocation>(
    "SupplierAllocation",
    SupplierAllocationSchema
  );

export default SupplierAllocation;

