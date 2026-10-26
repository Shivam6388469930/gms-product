import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

const PriceQuoteSchema = new Schema(
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

    baseCpi: {
      type: Number,
      required: true,
    },

    difficultyPremiumPercent: {
      type: Number,
      default: 0,
    },

    difficultyPremiumAmount: {
      type: Number,
      default: 0,
    },

    urgencyPremiumPercent: {
      type: Number,
      default: 0,
    },

    urgencyPremiumAmount: {
      type: Number,
      default: 0,
    },

    qualityPremiumPercent: {
      type: Number,
      default: 0,
    },

    qualityPremiumAmount: {
      type: Number,
      default: 0,
    },

    finalCpi: {
      type: Number,
      required: true,
    },

    sampleCost: {
      type: Number,
      required: true,
    },

    programmingFee: {
      type: Number,
      default: 0,
    },

    projectManagementFee: {
      type: Number,
      default: 0,
    },

    analyticsFee: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    marginPercent: {
      type: Number,
      default: 0,
    },

    marginAmount: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    urgency: {
      type: String,
      enum: [
        "normal",
        "urgent",
        "very_urgent",
      ],
      default: "normal",
    },

    qualityTier: {
      type: String,
      enum: [
        "standard",
        "premium",
        "healthcare_b2b",
      ],
      default: "standard",
    },

    assumptions: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "expired",
        "accepted",
      ],
      default: "active",
    },

    tiers: {
      type: [
        {
          name: String,
          badge: String,
          cpi: Number,
          total: Number,
          deliveryDays: Number,
          description: String,
          recommended: Boolean,
        },
      ],
      default: [],
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default
  models.PriceQuote ||
  model("PriceQuote", PriceQuoteSchema);