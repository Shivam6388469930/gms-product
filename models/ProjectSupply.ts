import mongoose, { Schema } from "mongoose";
import "@/models/Project";
import "@/models/Supply";

const ProjectSupplySchema = new Schema(
  {
    /**
     * Research project.
     */
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    /**
     * Global supplier/supply record.
     */
    supply: {
      type: Schema.Types.ObjectId,
      ref: "Supply",
      required: true,
      index: true,
    },

    /**
     * Number of completes allocated to this supplier.
     */
    allocatedSample: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /**
     * CPI captured when allocation was made.
     *
     * This protects the project from future supplier
     * CPI changes.
     */
    allocatedCpi: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /**
     * Percentage of project traffic.
     *
     * Example:
     * 50 = 50%
     */
    routingPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /**
     * Supplier priority.
     *
     * 1 = highest priority
     */
    priority: {
      type: Number,
      default: 1,
      min: 1,
    },

    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
      index: true,
    },

    /**
     * Actual fieldwork statistics.
     */
    actualStarts: {
      type: Number,
      default: 0,
      min: 0,
    },

    actualCompletes: {
      type: Number,
      default: 0,
      min: 0,
    },

    actualSpend: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * When this supplier was allocated to the project.
     */
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Same supplier cannot be allocated twice
 * to the same project.
 */
ProjectSupplySchema.index(
  {
    project: 1,
    supply: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.ProjectSupply ||
  mongoose.model("ProjectSupply", ProjectSupplySchema);