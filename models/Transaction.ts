import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  project?: mongoose.Types.ObjectId;
  owner?: mongoose.Types.ObjectId;
  supplierCode?: string;
  type: "cpi_charge" | "supplier_payout" | "refund" | "adjustment" | "bonus";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  description: string;
  referenceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    supplierCode: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["cpi_charge", "supplier_payout", "refund", "adjustment", "bonus"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    referenceId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
