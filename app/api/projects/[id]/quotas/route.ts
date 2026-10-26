import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/config/db";
import Project from "@/models/Project";
import RespondentSession from "@/models/RespondentSession";
import { getUserId } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export interface QuotaCellItem {
  id: string;
  name: string;
  targetPct: number;
  targetCount: number;
  currentCompletes: number;
  remaining: number;
  percentageAchieved: number;
  status: "open" | "capped" | "paused";
  marketPct?: number;
}

export interface QuotaDimensionItem {
  id: string;
  name: string;
  category: "gender" | "age" | "region" | "income" | "custom";
  isInterlocked?: boolean;
  cells: QuotaCellItem[];
}

/**
 * Generate standard default demographic quotas based on sample size and targeting
 */
function generateDefaultQuotas(sampleSize: number, targeting?: any): QuotaDimensionItem[] {
  const genderTarget = Math.round(sampleSize * 0.5);
  const age1Target = Math.round(sampleSize * 0.35);
  const age2Target = Math.round(sampleSize * 0.40);
  const age3Target = Math.round(sampleSize * 0.25);

  return [
    {
      id: "dim-gender",
      name: "Gender Balancing",
      category: "gender",
      cells: [
        {
          id: "cell-male",
          name: "Male",
          targetPct: 50,
          targetCount: genderTarget,
          currentCompletes: 0,
          remaining: genderTarget,
          percentageAchieved: 0,
          status: "open",
          marketPct: 49.2,
        },
        {
          id: "cell-female",
          name: "Female",
          targetPct: 50,
          targetCount: genderTarget,
          currentCompletes: 0,
          remaining: genderTarget,
          percentageAchieved: 0,
          status: "open",
          marketPct: 50.8,
        },
      ],
    },
    {
      id: "dim-age",
      name: "Age Groups",
      category: "age",
      cells: [
        {
          id: "cell-age-18-34",
          name: "18 - 34 years",
          targetPct: 35,
          targetCount: age1Target,
          currentCompletes: 0,
          remaining: age1Target,
          percentageAchieved: 0,
          status: "open",
          marketPct: 34.5,
        },
        {
          id: "cell-age-35-54",
          name: "35 - 54 years",
          targetPct: 40,
          targetCount: age2Target,
          currentCompletes: 0,
          remaining: age2Target,
          percentageAchieved: 0,
          status: "open",
          marketPct: 40.0,
        },
        {
          id: "cell-age-55-plus",
          name: "55+ years",
          targetPct: 25,
          targetCount: age3Target,
          currentCompletes: 0,
          remaining: age3Target,
          percentageAchieved: 0,
          status: "open",
          marketPct: 25.5,
        },
      ],
    },
  ];
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Project not found", 404);

    await connectDB();

    const project = await Project.findOne({ _id: id, owner: userId }).lean();
    if (!project) return fail("Project not found", 404);

    const sampleSize = project.sampleSize || 100;
    const totalCompletes = project.progress?.completes || 0;

    let dimensions: QuotaDimensionItem[] = [];

    if (Array.isArray(project.quotas) && project.quotas.length > 0) {
      dimensions = project.quotas.map((dim: any, dIdx: number) => {
        const cells: QuotaCellItem[] = (dim.cells || []).map((cell: any, cIdx: number) => {
          const targetPct = Number(cell.targetPct) || 0;
          const targetCount = cell.targetCount !== undefined ? Number(cell.targetCount) : Math.round((targetPct / 100) * sampleSize);
          
          // Estimate completes based on proportion or recorded completes
          let currentCompletes = Number(cell.currentCompletes) || 0;
          if (totalCompletes > 0 && currentCompletes === 0 && targetPct > 0) {
            currentCompletes = Math.round(totalCompletes * (targetPct / 100));
          }

          const isPaused = cell.status === "paused";
          const isCapped = !isPaused && (currentCompletes >= targetCount && targetCount > 0);
          const status = isPaused ? "paused" : isCapped ? "capped" : "open";

          return {
            id: cell.id || `cell-${dIdx}-${cIdx}`,
            name: cell.name || `Cell ${cIdx + 1}`,
            targetPct,
            targetCount,
            currentCompletes,
            remaining: Math.max(0, targetCount - currentCompletes),
            percentageAchieved: targetCount > 0 ? Math.min(100, Math.round((currentCompletes / targetCount) * 100)) : 0,
            status,
            marketPct: cell.marketPct,
          };
        });

        return {
          id: dim.id || `dim-${dIdx}`,
          name: dim.name || "Demographic Quota",
          category: dim.category || "custom",
          isInterlocked: Boolean(dim.isInterlocked),
          cells,
        };
      });
    } else {
      // Provide defaults
      const defaults = generateDefaultQuotas(sampleSize, project.targeting);
      dimensions = defaults.map((dim) => {
        return {
          ...dim,
          cells: dim.cells.map((cell) => {
            const currentCompletes = totalCompletes > 0 ? Math.round(totalCompletes * (cell.targetPct / 100)) : 0;
            const isCapped = currentCompletes >= cell.targetCount && cell.targetCount > 0;
            return {
              ...cell,
              currentCompletes,
              remaining: Math.max(0, cell.targetCount - currentCompletes),
              percentageAchieved: cell.targetCount > 0 ? Math.min(100, Math.round((currentCompletes / cell.targetCount) * 100)) : 0,
              status: isCapped ? "capped" : "open",
            };
          }),
        };
      });
    }

    const allCells = dimensions.flatMap((d) => d.cells);
    const summary = {
      sampleSize,
      totalCompletes,
      totalDimensions: dimensions.length,
      totalCells: allCells.length,
      cappedCells: allCells.filter((c) => c.status === "capped").length,
      openCells: allCells.filter((c) => c.status === "open").length,
      pausedCells: allCells.filter((c) => c.status === "paused").length,
    };

    return NextResponse.json({
      success: true,
      quotas: dimensions,
      overquotaConfig: project.overquotaConfig || {
        bufferPercent: 5,
        action: "terminate",
        redirectUrl: "",
      },
      summary,
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/quotas error:", error);
    return fail("Failed to fetch quotas", 500);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Project not found", 404);

    const body = await req.json().catch(() => ({}));
    const { quotas, overquotaConfig } = body;

    await connectDB();

    const project = await Project.findOne({ _id: id, owner: userId });
    if (!project) return fail("Project not found", 404);

    if (Array.isArray(quotas)) {
      project.quotas = quotas;
      // Also reflect in targeting.quotaNesting for backward compatibility
      if (project.targeting) {
        project.targeting.quotaNesting = quotas;
      }
    }

    if (overquotaConfig && typeof overquotaConfig === "object") {
      project.overquotaConfig = {
        bufferPercent: Number(overquotaConfig.bufferPercent) || 0,
        action: overquotaConfig.action || "terminate",
        redirectUrl: String(overquotaConfig.redirectUrl || ""),
      };
    }

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Quotas updated successfully",
      quotas: project.quotas,
      overquotaConfig: project.overquotaConfig,
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/quotas error:", error);
    return fail("Failed to save quotas", 500);
  }
}
