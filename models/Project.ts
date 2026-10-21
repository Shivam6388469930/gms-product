import mongoose, { Schema } from "mongoose";

const counter = {
  type: Number,
  default: 0,
};

/* =========================================================
   SURVEY SETUP
========================================================= */

const SurveySetupSchema = new Schema(
  {
    surveyUrl: {
      type: String,
      default: "",
      trim: true,
    },

    surveyType: {
      type: String,
      enum: ["external", "internal"],
      default: "external",
    },

    estimatedLoi: {
      type: Number,
      min: 1,
    },

    redirectUrl: {
      type: String,
      default: "",
      trim: true,
    },

    terminationUrl: {
      type: String,
      default: "",
      trim: true,
    },

    qualificationUrl: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["not_configured", "ready"],
      default: "not_configured",
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   SCREENER
========================================================= */

const ScreenerOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    isQualifying: { type: Boolean, default: true },
  },
  { _id: false }
);

const ScreenerQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    questionText: { type: String, required: true },
    category: { type: String, default: "general" },
    type: {
      type: String,
      enum: ["single_choice", "multi_choice", "boolean"],
      default: "single_choice",
    },
    options: {
      type: [ScreenerOptionSchema],
      default: [],
    },
    terminationReason: {
      type: String,
      default: "Does not meet qualifying research criteria.",
    },
  },
  { _id: false }
);

const ScreenerConfigSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    blockDuplicateIp: {
      type: Boolean,
      default: true,
    },
    strictIpTermination: {
      type: Boolean,
      default: true,
    },
    questions: {
      type: [ScreenerQuestionSchema],
      default: [],
    },
  },
  { _id: false }
);

/* =========================================================
   TARGETING
========================================================= */

const TargetingSchema = new Schema(
  {
    country: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    language: {
      type: String,
      default: "English",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    gender: {
      type: String,
      default: "All",
      trim: true,
    },

    age: {
      type: Schema.Types.Mixed,
      default: "All",
    },

    income: {
      type: Schema.Types.Mixed,
      default: "All",
    },

    hispanicOrigin: {
      type: String,
      default: "All",
      trim: true,
    },

    relationship: {
      type: String,
      default: "All",
      trim: true,
    },

    children: {
      type: String,
      default: "All",
      trim: true,
    },

    employment: {
      type: String,
      default: "All",
      trim: true,
    },

    education: {
      type: String,
      default: "All",
      trim: true,
    },

    device: {
      type: String,
      default: "All",
      trim: true,
    },

    advancedTargeting: {
      type: [Schema.Types.Mixed],
      default: [],
    },

    location: {
      region: {
        type: [String],
        default: [],
      },

      division: {
        type: [String],
        default: [],
      },

      state: {
        type: [String],
        default: [],
      },

      csa: {
        type: [String],
        default: [],
      },

      cbsa: {
        type: [String],
        default: [],
      },

      county: {
        type: [String],
        default: [],
      },

      dma: {
        type: [String],
        default: [],
      },

      zipcode: {
        type: [String],
        default: [],
      },
    },

    quotaNesting: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   PROJECT / SURVEY
========================================================= */

const ProjectSchema = new Schema(
  {
    /* =======================================================
       OWNER
    ======================================================= */

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =======================================================
       BASIC PROJECT INFO
    ======================================================= */

    surveyTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
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
      enum: [
        "consumer",
        "b2b",
        "healthcare",
      ],
      index: true,
    },

    audienceDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    /* =======================================================
       FEASIBILITY
    ======================================================= */

    sampleSize: {
      type: Number,
      required: true,
      min: 10,
      max: 100000,
    },

    loi: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
    },

    ir: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    estimate: {
      type: Schema.Types.Mixed,
      required: true,
    },

    /* =======================================================
       TARGETING
    ======================================================= */

    targeting: {
      type: TargetingSchema,
      default: () => ({}),
    },

    /* =======================================================
       SURVEY SETUP
    ======================================================= */

    surveySetup: {
      type: SurveySetupSchema,
      default: () => ({
        surveyType: "external",
        status: "not_configured",
      }),
    },

    /* =======================================================
       SCREENER CONFIG
    ======================================================= */

    screener: {
      type: ScreenerConfigSchema,
      default: () => ({
        enabled: true,
        blockDuplicateIp: true,
        strictIpTermination: true,
        questions: [],
      }),
    },

    /* =======================================================
       STATUS
    ======================================================= */

    status: {
      type: String,
      enum: [
        "draft",
        "live",
        "paused",
        "stopped",
      ],
      default: "draft",
      index: true,
    },

    /* =======================================================
       PROGRESS
    ======================================================= */

    progress: {
      starts: counter,
      completes: counter,
      screenouts: counter,
      quotaFull: counter,
      qualityRejects: counter,
      spend: counter,
    },

    /* =======================================================
       TIMESTAMPS
    ======================================================= */

    launchedAt: {
      type: Date,
    },

    stoppedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProjectSchema.virtual("name").get(function (this: { surveyTitle?: string }) {
  return this.surveyTitle || "";
});

/* =========================================================
   MODEL
========================================================= */
const ProjectModel =
  mongoose.models.Project ??
  mongoose.model("Project", ProjectSchema);

  console.log(
  "========== PROJECT MODEL =========="
);

console.log(
  "Project model:",
  ProjectModel.modelName
);

console.log(
  "Project schema paths:",
  Object.keys(ProjectModel.schema.paths)
);

console.log(
  "Project name path:",
  ProjectModel.schema.path("name")
);

console.log(
  "Project surveyTitle path:",
  ProjectModel.schema.path("surveyTitle")
);

console.log(
  "=================================="
);

export default ProjectModel;