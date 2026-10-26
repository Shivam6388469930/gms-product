import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoutingRule extends Document {
  name: string;
  project?: mongoose.Types.ObjectId;
  strategy: "waterfall" | "weighted_allocation" | "priority_first" | "auto_rebalance";
  suppliers: {
    supplierCode: string;
    supplierName: string;
    priority: number;
    allocationPercent: number;
    maxCompletes: number;
    currentCompletes: number;
    active: boolean;
  }[];
  fallbackAction: "screenout_redirect" | "route_to_backup" | "hold_queue";
  backupSurveyUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoutingRuleSchema = new Schema<IRoutingRule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    strategy: {
      type: String,
      enum: ["waterfall", "weighted_allocation", "priority_first", "auto_rebalance"],
      default: "weighted_allocation",
    },
    suppliers: [
      {
        supplierCode: { type: String, required: true },
        supplierName: { type: String, required: true },
        priority: { type: Number, default: 1 },
        allocationPercent: { type: Number, default: 50 },
        maxCompletes: { type: Number, default: 100 },
        currentCompletes: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
      },
    ],
    fallbackAction: {
      type: String,
      enum: ["screenout_redirect", "route_to_backup", "hold_queue"],
      default: "screenout_redirect",
    },
    backupSurveyUrl: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const RoutingRule: Model<IRoutingRule> =
  mongoose.models.RoutingRule ||
  mongoose.model<IRoutingRule>("RoutingRule", RoutingRuleSchema);

export default RoutingRule;
