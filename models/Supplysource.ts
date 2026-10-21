import mongoose, { Schema } from "mongoose";

// One row per supply source (own panel, partner panel...) per market and audience.
const SupplySourceSchema = new Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    audienceType: { type: String, enum: ["consumer", "b2b", "healthcare"], required: true },
    // Members active in the last ~90 days who match this audience's base profile
    activeMembers: { type: Number, required: true, min: 0 },
    // Share of invited members who click through and start (0–1)
    startRate: { type: Number, default: 0.12, min: 0.001, max: 1 },
    // What this source costs you per complete (USD) at IR 30% and LOI 10 min
    baseCpi: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SupplySourceSchema.index({ country: 1, audienceType: 1, active: 1 });

export default mongoose.models.SupplySource || mongoose.model("SupplySource", SupplySourceSchema);