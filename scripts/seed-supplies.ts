
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import Project from "../models/Project";
import Supply from "../models/Supply";

async function seedSupplies() {
  try {
    await connectDB();

    // Find a project ready for sample routing
    const project = await Project.findOne({
      status: "draft",
      "surveySetup.status": "ready",
    });

    if (!project) {
      throw new Error(
        "No draft project with completed Survey Setup was found."
      );
    }

    const suppliers = [
      {
        supplierCode: "TEST_SUP_001",
        supplierName: "Test Supplier Alpha",
        audienceDescription: "General population panel",
        availableSample: 10000,
        baseCpi: 1.5,
        historicalIr: 35,
        averageLoi: 10,
        qualityScore: 95,
        priority: 1,
        active: true,
      },
      {
        supplierCode: "TEST_SUP_002",
        supplierName: "Test Supplier Beta",
        audienceDescription: "Verified consumer panel",
        availableSample: 8000,
        baseCpi: 1.8,
        historicalIr: 30,
        averageLoi: 12,
        qualityScore: 90,
        priority: 2,
        active: true,
      },
      {
        supplierCode: "TEST_SUP_003",
        supplierName: "Test Supplier Gamma",
        audienceDescription: "Broad online research panel",
        availableSample: 6000,
        baseCpi: 2.0,
        historicalIr: 25,
        averageLoi: 15,
        qualityScore: 85,
        priority: 3,
        active: true,
      },
    ];

    for (const supplier of suppliers) {
      await Supply.findOneAndUpdate(
        {
          supplierCode: supplier.supplierCode,
        },
        {
          $set: {
            ...supplier,
            country: project.country,
            audienceType: project.audienceType,
            lastUpdatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log("Test suppliers seeded successfully!");
    console.log("Project:", project.name);
    console.log("Country:", project.country);
    console.log("Audience type:", project.audienceType);
    console.log("Required sample:", project.sampleSize);
    console.log("Suppliers created/updated:", suppliers.length);
  } catch (error) {
    console.error("Supplier seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSupplies();
