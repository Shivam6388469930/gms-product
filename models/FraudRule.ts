import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFraudRule extends Document {
  ruleType: "ip_block" | "fingerprint_block" | "respondent_block" | "speeder_loi" | "proxy_vpn";
  value: string;
  reason: string;
  riskScore: number;
  active: boolean;
  blockCount: number;
  addedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FraudRuleSchema = new Schema<IFraudRule>(
  {
    ruleType: {
      type: String,
      enum: ["ip_block", "fingerprint_block", "respondent_block", "speeder_loi", "proxy_vpn"],
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      default: "Flagged by security engine",
    },
    riskScore: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    blockCount: {
      type: Number,
      default: 0,
    },
    addedBy: {
      type: String,
      default: "System Admin",
    },
  },
  {
    timestamps: true,
  }
);

const FraudRule: Model<IFraudRule> =
  mongoose.models.FraudRule ||
  mongoose.model<IFraudRule>("FraudRule", FraudRuleSchema);

export default FraudRule;
