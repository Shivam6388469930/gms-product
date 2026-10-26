import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApiKey extends Document {
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  rateLimit: number; // requests per minute
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    scopes: {
      type: [String],
      default: ["read:projects", "read:surveys"],
    },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
      index: true,
    },
    rateLimit: {
      type: Number,
      default: 60,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export default ApiKey;
