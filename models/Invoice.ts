import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoice extends Document {
  project: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;

  invoiceNumber: string;

  /** Line items */
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  subtotal: number;
  tax: number;
  taxPercent: number;
  total: number;

  currency: string;

  status: "draft" | "issued" | "paid" | "disputed" | "cancelled";

  issuedAt?: Date;
  paidAt?: Date;
  dueAt?: Date;

  notes: string;

  /** Reconciliation fields */
  reconciliation: {
    buyerCompletes: number;
    supplierCompletes: number;
    discrepancy: number;
    reconciledAt?: Date;
    reconciledBy?: mongoose.Types.ObjectId;
    status: "pending" | "matched" | "discrepant" | "resolved";
  };

  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReconciliationSchema = new Schema(
  {
    buyerCompletes: { type: Number, default: 0, min: 0 },
    supplierCompletes: { type: Number, default: 0, min: 0 },
    discrepancy: { type: Number, default: 0 },
    reconciledAt: { type: Date },
    reconciledBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "matched", "discrepant", "resolved"],
      default: "pending",
    },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    items: {
      type: [InvoiceItemSchema],
      default: [],
    },

    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    currency: { type: String, default: "USD" },

    status: {
      type: String,
      enum: ["draft", "issued", "paid", "disputed", "cancelled"],
      default: "draft",
      index: true,
    },

    issuedAt: { type: Date },
    paidAt: { type: Date },
    dueAt: { type: Date },

    notes: { type: String, default: "", trim: true },

    reconciliation: {
      type: ReconciliationSchema,
      default: () => ({
        buyerCompletes: 0,
        supplierCompletes: 0,
        discrepancy: 0,
        status: "pending",
      }),
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ project: 1, createdAt: -1 });
InvoiceSchema.index({ owner: 1, status: 1 });

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
