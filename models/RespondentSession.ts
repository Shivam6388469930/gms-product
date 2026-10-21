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
  respondentId: string;
  supplierCode: string;
  ip: string;
  userAgent: string;
  status: "screened_out" | "qualified" | "completed" | "blocked_duplicate_ip";
  passedScreener: boolean;
  screenerAnswers: IScreenerAnswer[];
  terminatedReason: string;
  targetSurveyUrl?: string;
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
      enum: ["screened_out", "qualified", "completed", "blocked_duplicate_ip"],
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
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly look up IP within a project
RespondentSessionSchema.index({ project: 1, ip: 1 });

const RespondentSession: Model<IRespondentSession> =
  mongoose.models.RespondentSession ||
  mongoose.model<IRespondentSession>("RespondentSession", RespondentSessionSchema);

export default RespondentSession;
