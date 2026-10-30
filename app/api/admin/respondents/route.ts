import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import RespondentSession from "@/models/RespondentSession";
import Supply from "@/models/Supply";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || "20", 10) || 20
      )
    );

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const supplierCode = (
      searchParams.get("supplierCode") || ""
    ).trim();
    const projectId = (searchParams.get("projectId") || "").trim();
    const minFraudScore = searchParams.get("minFraudScore");

    const query: Record<string, any> = {};

    // ------------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------------

    if (search) {
      query.$or = [
        {
          respondentId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          ip: {
            $regex: search,
            $options: "i",
          },
        },
        {
          deviceFingerprint: {
            $regex: search,
            $options: "i",
          },
        },
        {
          supplierCode: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ------------------------------------------------------------
    // FILTERS
    // ------------------------------------------------------------

    if (status) {
      query.status = status;
    }

    if (supplierCode) {
      query.supplierCode = supplierCode;
    }

    if (projectId) {
      query.project = projectId;
    }

    if (minFraudScore) {
      const score = parseInt(minFraudScore, 10);

      if (!Number.isNaN(score)) {
        query.fraudScore = {
          $gte: score,
        };
      }
    }

    // ------------------------------------------------------------
    // GET RESPONDENT SESSIONS
    // ------------------------------------------------------------

    const [sessions, total, statsAgg, totalSessions] =
      await Promise.all([
        RespondentSession.find(query)
          .populate(
            "project",
            "surveyTitle country"
          )
          .sort({
            createdAt: -1,
          })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        RespondentSession.countDocuments(query),

        RespondentSession.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
        ]),

        RespondentSession.countDocuments(),
      ]);

    // ------------------------------------------------------------
    // FIND SUPPLIERS
    // ------------------------------------------------------------

    const supplierCodes = [
      ...new Set(
        sessions
          .map((session: any) =>
            String(session.supplierCode || "").trim()
          )
          .filter(Boolean)
      ),
    ];

    const suppliers =
      supplierCodes.length > 0
        ? await Supply.find({
            supplierCode: {
              $in: supplierCodes,
            },
          })
            .select(
              [
                "_id",
                "supplierName",
                "supplierCode",
                "supplierEmail",
                "country",
                "audienceType",
                "audienceDescription",
                "availableSample",
                "baseCpi",
                "historicalIr",
                "averageLoi",
                "qualityScore",
                "active",
                "lastUpdatedAt",
              ].join(" ")
            )
            .lean()
        : [];

    // ------------------------------------------------------------
    // SUPPLIER MAP
    // ------------------------------------------------------------

    const supplierMap = new Map<string, any>();

    for (const supplier of suppliers) {
      supplierMap.set(
        String(supplier.supplierCode).trim().toLowerCase(),
        supplier
      );
    }

    // ------------------------------------------------------------
    // ATTACH SUPPLIER TO EACH RESPONDENT SESSION
    // ------------------------------------------------------------

    const respondents = sessions.map((session: any) => {
      const code = String(
        session.supplierCode || ""
      )
        .trim()
        .toLowerCase();

      return {
        ...session,

        supplier: code
          ? supplierMap.get(code) || null
          : null,
      };
    });

    // ------------------------------------------------------------
    // STATS
    // ------------------------------------------------------------

    const statsMap: Record<string, number> = {};

    for (const item of statsAgg) {
      statsMap[item._id] = item.count;
    }

    // ------------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------------

    return NextResponse.json({
      success: true,

      respondents,

      stats: {
        total: totalSessions,

        completed:
          statsMap["completed"] || 0,

        screened_out:
          statsMap["screened_out"] || 0,

        quota_full:
          statsMap["quota_full"] || 0,

        quality_reject:
          statsMap["quality_reject"] || 0,

        blocked:
          (statsMap["blocked_duplicate_ip"] || 0) +
          (statsMap["blocked_exclusion"] || 0) +
          (statsMap["blocked_fingerprint"] || 0),
      },

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/respondents error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch respondents",
        respondents: [],
      },
      {
        status: 500,
      }
    );
  }
}