// models/User.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole =
  | "admin"
  | "manager"
  | "user"
  | "client"
  | "buyer"
  | "supplier"
  | "respondent"
  | "viewer";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;

  role: UserRole;

  emailVerified: boolean;

  emailVerificationToken?: string;
  emailVerificationExpires?: Date;

  passwordResetToken?: string;
  passwordResetExpires?: Date;

  isBlocked: boolean;

  supplierCode?: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierPostbackUrls?: {
    complete: string;
    disqualified: string;
    quotaFull: string;
    securityTerminate: string;
  };

  respondentId?: string;
  mustChangePassword:boolean;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: true,
    },

    role: {
      type: String,
      default: "client",
      enum: [
        "admin",
        "manager",
        "user",
        "client",
        "buyer",
        "supplier",
        "respondent",
        "viewer",
      ],
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    supplierCode: {
      type: String,
      trim: true,
      index: true,
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supply",
      index: true,
    },

    supplierPostbackUrls: {
      complete: { type: String, default: "", trim: true },
      disqualified: { type: String, default: "", trim: true },
      quotaFull: { type: String, default: "", trim: true },
      securityTerminate: { type: String, default: "", trim: true },
    },

    respondentId: {
      type: String,
      trim: true,
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;