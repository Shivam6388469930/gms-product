import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  paymentId: string;
  batchNumber: string;
  recipientName: string;
  recipientType: "supplier" | "client";
  supplierCode?: string;
  amount: number;
  currency: string;
  method: "wire" | "paypal" | "stripe" | "wise" | "ach";
  status: "draft" | "processing" | "paid" | "failed" | "cancelled";
  referenceNotes?: string;
  processedAt?: Date;
  paidAt?: Date;
  invoiceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    batchNumber: {
      type: String,
      default: "BATCH-DEFAULT",
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientType: {
      type: String,
      enum: ["supplier", "client"],
      default: "supplier",
    },
    supplierCode: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    method: {
      type: String,
      enum: ["wire", "paypal", "stripe", "wise", "ach"],
      default: "wire",
    },
    status: {
      type: String,
      enum: ["draft", "processing", "paid", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    referenceNotes: {
      type: String,
      default: "",
    },
    processedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
