// models/Supply.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupply extends Document {
  supplierName: string;
  supplierCode: string;
  supplierEmail: string;

  country: string;
  audienceType: "consumer" | "b2b" | "healthcare";
  audienceDescription: string;

  availableSample: number;
  baseCpi: number;
  historicalIr: number;
  averageLoi: number;
  qualityScore: number;

  active: boolean;
  lastUpdatedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const SupplySchema = new Schema<ISupply>(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    supplierCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    supplierEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    audienceType: {
      type: String,
      required: true,
      enum: ["consumer", "b2b", "healthcare"],
      index: true,
    },

    audienceDescription: {
      type: String,
      default: "",
      trim: true,
    },

    availableSample: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    baseCpi: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    historicalIr: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    averageLoi: {
      type: Number,
      default: 0,
      min: 0,
    },

    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * One supplier can have multiple supply records:
 *
 * SUP_A + US + consumer
 * SUP_A + UK + consumer
 * SUP_A + US + b2b
 *
 * But the exact same combination cannot exist twice.
 */
SupplySchema.index(
  {
    supplierCode: 1,
    country: 1,
    audienceType: 1,
  },
  {
    unique: true,
  }
);

const Supply: Model<ISupply> =
  mongoose.models.Supply ||
  mongoose.model<ISupply>("Supply", SupplySchema);

export default Supply;