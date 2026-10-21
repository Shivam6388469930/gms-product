import {
  AUDIENCES,
  COUNTRIES,
  type ProjectInput,
  type QuotaDimension,
  type SurveyTargeting,
} from "./project-config";

type Result =
  | {
      ok: true;
      value: ProjectInput;
    }
  | {
      ok: false;
      message: string;
    };

/* =========================================================
   HELPERS
========================================================= */

const inRange = (
  value: unknown,
  min: number,
  max: number
) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

const sumsTo100 = (values: number[]) =>
  Math.abs(
    values.reduce((sum, value) => sum + value, 0) - 100
  ) <= 1;

/* =========================================================
   QUOTA VALIDATION
========================================================= */

function parseQuotas(
  raw: unknown
):
  | {
      ok: true;
      value: QuotaDimension[];
    }
  | {
      ok: false;
      message: string;
    } {
  if (raw == null) {
    return {
      ok: true,
      value: [],
    };
  }

  if (!Array.isArray(raw) || raw.length > 5) {
    return {
      ok: false,
      message: "Quotas: up to 5 dimensions allowed",
    };
  }

  const value: QuotaDimension[] = [];

  for (const dimension of raw) {
    const name =
      typeof dimension?.name === "string"
        ? dimension.name.trim()
        : "";

    if (!name || name.length > 40) {
      return {
        ok: false,
        message:
          "Each quota needs a name (max 40 characters)",
      };
    }

    if (
      !Array.isArray(dimension.cells) ||
      dimension.cells.length < 2 ||
      dimension.cells.length > 10
    ) {
      return {
        ok: false,
        message: `Quota "${name}" needs 2–10 cells`,
      };
    }

    const cells: QuotaDimension["cells"] = [];

    for (const cell of dimension.cells) {
      const label =
        typeof cell?.label === "string"
          ? cell.label.trim()
          : "";

      if (!label || label.length > 40) {
        return {
          ok: false,
          message: `Quota "${name}": each cell needs a label`,
        };
      }

      if (!inRange(cell?.targetPct, 0.1, 100)) {
        return {
          ok: false,
          message: `Quota "${name}": target % must be between 0.1 and 100`,
        };
      }

      if (
        cell?.marketPct != null &&
        !inRange(cell.marketPct, 0.1, 100)
      ) {
        return {
          ok: false,
          message: `Quota "${name}": market % must be between 0.1 and 100`,
        };
      }

      cells.push({
        label,
        targetPct: cell.targetPct as number,
        ...(cell.marketPct != null
          ? {
              marketPct: cell.marketPct as number,
            }
          : {}),
      });
    }

    /* -----------------------------------------
       TARGET PERCENTAGE
    ----------------------------------------- */

    if (
      !sumsTo100(
        cells.map((cell) => cell.targetPct)
      )
    ) {
      return {
        ok: false,
        message: `Quota "${name}": target percentages must add up to 100`,
      };
    }

    /* -----------------------------------------
       MARKET PERCENTAGE
    ----------------------------------------- */

    const hasMarketPercentage = cells.some(
      (cell) => cell.marketPct != null
    );

    if (hasMarketPercentage) {
      const everyCellHasMarketPercentage =
        cells.every(
          (cell) => cell.marketPct != null
        );

      if (!everyCellHasMarketPercentage) {
        return {
          ok: false,
          message: `Quota "${name}": market percentages must be given for every cell and add up to 100`,
        };
      }

      if (
        !sumsTo100(
          cells.map(
            (cell) => cell.marketPct as number
          )
        )
      ) {
        return {
          ok: false,
          message: `Quota "${name}": market percentages must be given for every cell and add up to 100`,
        };
      }
    }

    value.push({
      name,
      cells,
    });
  }

  return {
    ok: true,
    value,
  };
}

/* =========================================================
   TARGETING VALIDATION
========================================================= */

function parseTargeting(
  raw: unknown,
  fallbackCountry: string
): SurveyTargeting {
  const targeting =
    raw && typeof raw === "object"
      ? (raw as Record<string, any>)
      : {};

  const rawLocation =
    targeting.location &&
    typeof targeting.location === "object"
      ? targeting.location
      : {};

  return {
    /* -----------------------------------------
       BASIC TARGETING
    ----------------------------------------- */

    country:
      (typeof targeting.country === "string"
        ? targeting.country.trim()
        : fallbackCountry) as any,

    language:
      typeof targeting.language === "string"
        ? targeting.language.trim()
        : "English",

    category:
      typeof targeting.category === "string"
        ? targeting.category.trim()
        : "",

    /* -----------------------------------------
       DEMOGRAPHICS
    ----------------------------------------- */

    gender:
      typeof targeting.gender === "string"
        ? targeting.gender.trim()
        : "All",

    age:
      targeting.age !== undefined &&
      targeting.age !== null
        ? targeting.age
        : "All",

    income:
      targeting.income !== undefined &&
      targeting.income !== null
        ? targeting.income
        : "All",

    hispanicOrigin:
      typeof targeting.hispanicOrigin === "string"
        ? targeting.hispanicOrigin.trim()
        : "All",

    relationship:
      typeof targeting.relationship === "string"
        ? targeting.relationship.trim()
        : "All",

    children:
      typeof targeting.children === "string"
        ? targeting.children.trim()
        : "All",

    employment:
      typeof targeting.employment === "string"
        ? targeting.employment.trim()
        : "All",

    education:
      typeof targeting.education === "string"
        ? targeting.education.trim()
        : "All",

    device:
      typeof targeting.device === "string"
        ? targeting.device.trim()
        : "All",

    /* -----------------------------------------
       ADVANCED TARGETING
    ----------------------------------------- */

    advancedTargeting: Array.isArray(
      targeting.advancedTargeting
    )
      ? targeting.advancedTargeting
      : [],

    /* -----------------------------------------
       LOCATION
    ----------------------------------------- */

    location: {
      region: Array.isArray(rawLocation.region)
        ? rawLocation.region
        : [],

      division: Array.isArray(rawLocation.division)
        ? rawLocation.division
        : [],

      state: Array.isArray(rawLocation.state)
        ? rawLocation.state
        : [],

      csa: Array.isArray(rawLocation.csa)
        ? rawLocation.csa
        : [],

      cbsa: Array.isArray(rawLocation.cbsa)
        ? rawLocation.cbsa
        : [],

      county: Array.isArray(rawLocation.county)
        ? rawLocation.county
        : [],

      dma: Array.isArray(rawLocation.dma)
        ? rawLocation.dma
        : [],

      zipcode: Array.isArray(rawLocation.zipcode)
        ? rawLocation.zipcode
        : [],
    },

    /* -----------------------------------------
       QUOTA NESTING
    ----------------------------------------- */

    quotaNesting: Array.isArray(
      targeting.quotaNesting
    )
      ? targeting.quotaNesting
      : [],
  };
}

/* =========================================================
   PROJECT INPUT VALIDATION
========================================================= */

export function parseProjectInput(
  body: any,
  requireSurveyTitle = true
): Result {
  /* -----------------------------------------
     SURVEY TITLE
  ----------------------------------------- */

  const surveyTitle =
    typeof body?.surveyTitle === "string"
      ? body.surveyTitle.trim()
      : "";

  /* -----------------------------------------
     DESCRIPTION
  ----------------------------------------- */

  const audienceDescription =
    typeof body?.audienceDescription === "string"
      ? body.audienceDescription.trim()
      : "";

  /* -----------------------------------------
     BASIC VALUES
  ----------------------------------------- */

  const {
    country,
    audienceType,
    sampleSize,
    loi,
    ir,
  } = body ?? {};

  /* -----------------------------------------
     SURVEY TITLE VALIDATION
  ----------------------------------------- */

  if (
    requireSurveyTitle &&
    (surveyTitle.length < 2 ||
      surveyTitle.length > 120)
  ) {
    return {
      ok: false,
      message:
        "Survey title must be 2–120 characters",
    };
  }

  /* -----------------------------------------
     COUNTRY VALIDATION
  ----------------------------------------- */

  if (
    !COUNTRIES.some(
      (countryItem) =>
        countryItem.code === country
    )
  ) {
    return {
      ok: false,
      message: "Choose a supported country",
    };
  }

  /* -----------------------------------------
     AUDIENCE VALIDATION
  ----------------------------------------- */

  if (
    !AUDIENCES.some(
      (audience) =>
        audience.value === audienceType
    )
  ) {
    return {
      ok: false,
      message: "Choose a valid audience type",
    };
  }

  /* -----------------------------------------
     SAMPLE SIZE VALIDATION
  ----------------------------------------- */

  if (
    !inRange(
      sampleSize,
      10,
      100000
    ) ||
    !Number.isInteger(sampleSize)
  ) {
    return {
      ok: false,
      message:
        "Sample size must be a whole number between 10 and 100,000",
    };
  }

  /* -----------------------------------------
     LOI VALIDATION
  ----------------------------------------- */

  if (
    !inRange(loi, 1, 60) ||
    !Number.isInteger(loi)
  ) {
    return {
      ok: false,
      message:
        "LOI must be between 1 and 60 minutes",
    };
  }

  /* -----------------------------------------
     IR VALIDATION
  ----------------------------------------- */

  if (!inRange(ir, 1, 100)) {
    return {
      ok: false,
      message:
        "Incidence rate must be between 1 and 100%",
    };
  }

  /* -----------------------------------------
     AUDIENCE DESCRIPTION
  ----------------------------------------- */

  if (audienceDescription.length > 500) {
    return {
      ok: false,
      message:
        "Audience description is too long (max 500 characters)",
    };
  }

  /* -----------------------------------------
     TARGETING
  ----------------------------------------- */

  const targeting = parseTargeting(
    body?.targeting,
    country
  );

  /* -----------------------------------------
     QUOTAS
  ----------------------------------------- */

  const quotas = parseQuotas(body?.quotas);

  if (!quotas.ok) {
    return quotas;
  }

  /* -----------------------------------------
     FINAL VALIDATED INPUT
  ----------------------------------------- */

  return {
    ok: true,

    value: {
      surveyTitle,

      country,

      audienceType,

      audienceDescription,

      sampleSize,

      loi,

      ir,

      targeting,

      quotas: quotas.value,
    },
  };
}