/**
 * Loads supply sources into MongoDB. Run once, then edit rows as your panels change:
 *   npx tsx --env-file=.env.local scripts/seed-supply.ts
 *
 * !! EXAMPLE VALUES ONLY. Replace with real figures from your panel dashboards
 * !! and partner contracts before trusting any estimate.
 * Change MONGODB_URI below if your env var has a different name.
 */
import mongoose from "mongoose";
import SupplySource from "../models/Supplysource";

const rows = [
  // name, country, audienceType, activeMembers, startRate, baseCpi (USD @ IR30 / LOI10)
  { name: "GMS Panel", country: "US", audienceType: "consumer", activeMembers: 120000, startRate: 0.12, baseCpi: 1.6 },
  { name: "GMS Panel", country: "GB", audienceType: "consumer", activeMembers: 60000, startRate: 0.12, baseCpi: 1.5 },
  { name: "GMS Panel", country: "IN", audienceType: "consumer", activeMembers: 200000, startRate: 0.15, baseCpi: 0.6 },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  for (const r of rows) {
    await SupplySource.updateOne(
      { name: r.name, country: r.country, audienceType: r.audienceType },
      { $set: { ...r, active: true } },
      { upsert: true }
    );
  }
  console.log(`Seeded ${rows.length} supply sources`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});