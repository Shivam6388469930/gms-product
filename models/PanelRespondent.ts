import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/SupplierPanel";
import "@/models/Respondent";

export interface IPanelRespondent extends Document {
  panelId: mongoose.Types.ObjectId;
  respondentId: mongoose.Types.ObjectId;
  supplierCode: string;
  status: "Active" | "Inactive";
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PanelRespondentSchema = new Schema<IPanelRespondent>(
  {
    panelId: {
      type: Schema.Types.ObjectId,
      ref: "SupplierPanel",
      required: true,
      index: true,
    },
    respondentId: {
      type: Schema.Types.ObjectId,
      ref: "Respondent",
      required: true,
      index: true,
    },
    supplierCode: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PanelRespondentSchema.index({ panelId: 1, respondentId: 1 }, { unique: true });
PanelRespondentSchema.index({ supplierCode: 1, panelId: 1 });

const PanelRespondent: Model<IPanelRespondent> =
  mongoose.models.PanelRespondent ||
  mongoose.model<IPanelRespondent>("PanelRespondent", PanelRespondentSchema);

export default PanelRespondent;
