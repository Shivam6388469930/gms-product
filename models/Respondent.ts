import mongoose, { Schema, Document, Model } from "mongoose";

import "@/models/SupplierPanel";
import "@/models/User";

export type RespondentStatus =
  | "Active"
  | "Inactive"
  | "Blocked"
  | "Suspended";

export interface IRespondent extends Document {
  respondentId: string;
  externalId?: string;

  supplierId: mongoose.Types.ObjectId;

  // Automatically created respondent User account
  userId: mongoose.Types.ObjectId;

  supplierCode?: string;

  firstName: string;
  lastName: string;
  name: string;

  email: string;
  phone?: string;

  country: string;
  state?: string;
  city?: string;

  gender?: string;
  dateOfBirth?: string;
  age?: number;

  employment?: string;
  industry?: string;
  jobTitle?: string;
  education?: string;
  incomeRange?: string;

  demographics?: Record<string, any>;

  panelId?: mongoose.Types.ObjectId;
  panels: mongoose.Types.ObjectId[];

  status: RespondentStatus;

  qualityScore: number;
  fraudRiskScore: number;

  totalSurveys: number;
  completedSurveys: number;
  screenouts: number;
  quotaFull: number;
  qualityRejects: number;

  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;

  lastActiveAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const RespondentSchema = new Schema<IRespondent>(
  {
    respondentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    externalId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    /*
     * SUPPLIER
     *
     * Respondent.supplierId -> User._id
     *
     * User.role must be "supplier"
     */
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * RESPONDENT USER
     *
     * Every supplier-created respondent gets
     * an automatic User account.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    supplierCode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      required: true,
      default: "US",
      trim: true,
      index: true,
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    gender: {
      type: String,
      trim: true,
      default: "Unspecified",
    },

    dateOfBirth: {
      type: String,
      trim: true,
      default: "",
    },

    age: {
      type: Number,
      min: 13,
      max: 120,
    },

    employment: {
      type: String,
      trim: true,
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      default: "",
    },

    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },

    education: {
      type: String,
      trim: true,
      default: "",
    },

    incomeRange: {
      type: String,
      trim: true,
      default: "",
    },

    demographics: {
      type: Schema.Types.Mixed,
      default: {},
    },

    panelId: {
      type: Schema.Types.ObjectId,
      ref: "SupplierPanel",
      index: true,
    },

    panels: [
      {
        type: Schema.Types.ObjectId,
        ref: "SupplierPanel",
      },
    ],

    status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked", "Suspended"],
      default: "Active",
      index: true,
    },

    qualityScore: {
      type: Number,
      default: 95,
      min: 0,
      max: 100,
    },

    fraudRiskScore: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },

    totalSurveys: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedSurveys: {
      type: Number,
      default: 0,
      min: 0,
    },

    screenouts: {
      type: Number,
      default: 0,
      min: 0,
    },

    quotaFull: {
      type: Number,
      default: 0,
      min: 0,
    },

    qualityRejects: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * PANEL SYNC
 *
 * Keep panelId and panels synchronized.
 */
RespondentSchema.pre("validate", function (next) {
  if (this.panelId && (!this.panels || this.panels.length === 0)) {
    this.panels = [this.panelId];
  }

  if (!this.panelId && this.panels && this.panels.length > 0) {
    this.panelId = this.panels[0];
  }

  next();
});

/*
 * INDEXES
 */

RespondentSchema.index({
  panelId: 1,
  status: 1,
});

RespondentSchema.index({
  supplierId: 1,
  status: 1,
});

RespondentSchema.index({
  supplierId: 1,
  email: 1,
});

RespondentSchema.index({
  supplierId: 1,
  panels: 1,
});

RespondentSchema.index({
  supplierId: 1,
  country: 1,
});

RespondentSchema.index({
  userId: 1,
});

/*
 * One User can belong to only one Respondent.
 */
RespondentSchema.index(
  {
    userId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

const Respondent: Model<IRespondent> =
  mongoose.models.Respondent ||
  mongoose.model<IRespondent>("Respondent", RespondentSchema);

export default Respondent;