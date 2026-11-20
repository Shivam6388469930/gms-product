// src/lib/project-resolver.ts

import mongoose from "mongoose";
import Project from "@/models/Project";

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve project using:
 *
 * 1. projectId
 * 2. projectCode
 * 3. studyId
 * 4. MongoDB _id
 *
 * Examples:
 *
 * GMS82473
 * GMS73920
 * 6ae8f8e22ffef0b6787867df
 */
export async function findProjectByIdOrProjectId(
    value: string
) {
    const id = String(value || "").trim();

    if (!id) {
        return null;
    }

    const regex = new RegExp(
        `^${escapeRegex(id)}$`,
        "i"
    );

    const conditions: any[] = [
        // Main business project ID
        {
            projectId: id,
        },
        {
            projectId: regex,
        },

        // Optional alternative fields
        {
            projectCode: id,
        },
        {
            projectCode: regex,
        },

        {
            studyId: id,
        },
        {
            studyId: regex,
        },

        {
            tnxProjectId: id,
        },
        {
            tnxProjectId: regex,
        },
    ];

    // Mongo ObjectId
    if (
        mongoose.Types.ObjectId.isValid(id)
    ) {
        conditions.push({
            _id: new mongoose.Types.ObjectId(id),
        });
    }

    const project =
        await Project.findOne({
            $or: conditions,
        });

    if (project) {
        console.log(
            "✅ Project resolved:",
            {
                requested: id,
                mongoId:
                    project._id.toString(),
                projectId:
                    (project as any).projectId,
            }
        );
    } else {
        console.error(
            "❌ Project could not be resolved:",
            id
        );
    }

    return project;
}