import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScreenerAnswer {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  isQualifying: boolean;
}

export interface IRespondentSession extends Document {
  project: mongoose.Types.ObjectId;
  projectId?: string;
  respondentId: string;
  supplierCode: string;
  ip: string;
  userAgent: string;
  status:
    | "started"
    | "screened_out"
    | "qualified"
    | "completed"
    | "blocked_duplicate_ip"
    | "blocked_exclusion"
    | "blocked_fingerprint"
    | "quota_full"
    | "quality_reject"
    | "terminate"
    | "terminated";
  passedScreener: boolean;
  screenerAnswers: IScreenerAnswer[];
  terminatedReason: string;
  targetSurveyUrl?: string;
  deviceFingerprint?: string;
  fraudScore?: number;
  crossProjectDuplicate?: boolean;
  country?: string;
  startedAt?: Date;
  completedAt?: Date;
  terminatedAt?: Date;
  quotaAt?: Date;
  redirectType?: string;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScreenerAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    selectedOptionId: { type: String, required: true },
    selectedOptionLabel: { type: String, required: true },
    isQualifying: { type: Boolean, required: true },
  },
  { _id: false }
);

const RespondentSessionSchema = new Schema<IRespondentSession>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      trim: true,
      index: true,
    },
    respondentId: {
      type: String,
      required: true,
      index: true,
    },
    supplierCode: {
      type: String,
      default: "DIRECT",
      trim: true,
    },
    ip: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "started",
        "screened_out",
        "qualified",
        "completed",
        "blocked_duplicate_ip",
        "blocked_exclusion",
        "blocked_fingerprint",
        "quota_full",
        "quality_reject",
        "terminate",
        "terminated",
      ],
      required: true,
      index: true,
    },
    passedScreener: {
      type: Boolean,
      default: false,
    },
    screenerAnswers: {
      type: [ScreenerAnswerSchema],
      default: [],
    },
    terminatedReason: {
      type: String,
      default: "",
      trim: true,
    },
    targetSurveyUrl: {
      type: String,
      default: "",
      trim: true,
    },
    deviceFingerprint: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    fraudScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    crossProjectDuplicate: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      default: "",
      trim: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    terminatedAt: {
      type: Date,
    },
    quotaAt: {
      type: Date,
    },
    redirectType: {
      type: String,
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
RespondentSessionSchema.index({ project: 1, respondentId: 1 });
RespondentSessionSchema.index({ projectId: 1, respondentId: 1 });
RespondentSessionSchema.index({ project: 1, ip: 1 });
RespondentSessionSchema.index({ respondentId: 1, startedAt: -1 });
RespondentSessionSchema.index({ project: 1, status: 1 });
RespondentSessionSchema.index({ status: 1, createdAt: -1 });
RespondentSessionSchema.index({ project: 1, ip: 1, status: 1 });
RespondentSessionSchema.index({ supplierCode: 1, createdAt: -1 });

const RespondentSession: Model<IRespondentSession> =
  mongoose.models.RespondentSession ||
  mongoose.model<IRespondentSession>("RespondentSession", RespondentSessionSchema);

export default RespondentSession;
