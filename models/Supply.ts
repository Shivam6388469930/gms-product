import mongoose, { Schema } from "mongoose";

const SupplySchema = new Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    /**
     * Supplier identifier.
     *
     * Do NOT make this globally unique because
     * one supplier can have multiple country/audience
     * supply records.
     */
    supplierCode: {
      type: String,
      required: true,
      trim: true,
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

    /**
     * Current available respondent capacity.
     */
    availableSample: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /**
     * Supplier base CPI.
     */
    baseCpi: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /**
     * Historical incidence rate.
     *
     * Stored as percentage:
     * 30 = 30%
     */
    historicalIr: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * Historical average survey length.
     */
    averageLoi: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Internal supplier quality score.
     */
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * Whether this supply source can currently
     * be used by the Feasibility/Sample engine.
     */
    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * When supplier capacity was last refreshed.
     */
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
 * One supplier can have:
 *
 * SUP_A + US + consumer
 * SUP_A + UK + consumer
 * SUP_A + US + b2b
 *
 * But the same combination cannot exist twice.
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

export default mongoose.models.Supply ||
  mongoose.model("Supply", SupplySchema);