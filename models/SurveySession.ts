import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";
import "@/models/Project";
import "@/models/User";
import "@/models/Respondent";
import "@/models/SupplierPanel";

export type SurveySessionStatus =
  | "invited"
  | "started"
  | "complete"
  | "terminate"
  | "quota_full"
  | "quality_fail"
  | "abandoned";

export interface ISurveySession extends Document {
  sessionToken: string;
  respondent: mongoose.Types.ObjectId;
  respondentId: string;
  supplier: mongoose.Types.ObjectId;
  supplierCode: string;
  panel?: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  surveyId: string;
  status: SurveySessionStatus;
  cpi: number;
  rewardAmount: number;
  ip: string;
  userAgent: string;
  deviceFingerprint: string;
  fraudScore: number;
  targetSurveyUrl: string;
  terminateReason: string;
  screenerAnswers: Array<{
    questionId: string;
    questionText: string;
    selectedOptionId: string;
    selectedOptionLabel: string;
    isQualifying: boolean;
  }>;
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySessionSchema = new Schema<ISurveySession>(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(24).toString("hex"),
    },
    respondent: {
      type: Schema.Types.ObjectId,
      ref: "Respondent",
      required: true,
      index: true,
    },
    respondentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    supplierCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    panel: {
      type: Schema.Types.ObjectId,
      ref: "SupplierPanel",
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    surveyId: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "invited",
        "started",
        "complete",
        "terminate",
        "quota_full",
        "quality_fail",
        "abandoned",
      ],
      default: "invited",
      index: true,
    },
    cpi: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    ip: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    deviceFingerprint: {
      type: String,
      default: "",
      trim: true,
    },
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    targetSurveyUrl: {
      type: String,
      default: "",
      trim: true,
    },
    terminateReason: {
      type: String,
      default: "",
      trim: true,
    },
    screenerAnswers: {
      type: [
        {
          questionId: { type: String, required: true },
          questionText: { type: String, required: true },
          selectedOptionId: { type: String, required: true },
          selectedOptionLabel: { type: String, required: true },
          isQualifying: { type: Boolean, required: true },
        },
      ],
      default: [],
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

SurveySessionSchema.index({ project: 1, respondentId: 1 });
SurveySessionSchema.index({ respondent: 1, status: 1 });
SurveySessionSchema.index({ supplier: 1, status: 1 });

const SurveySession: Model<ISurveySession> =
  mongoose.models.SurveySession ||
  mongoose.model<ISurveySession>("SurveySession", SurveySessionSchema);

export default SurveySession;

