import mongoose, { Document, Model, Schema } from "mongoose";

export type SupplierPanelStatus =
  | "active"
  | "inactive"
  | "paused"
  | "archived";

export type SupplierPanelCategory =
  | "Consumer"
  | "B2B Tech"
  | "Healthcare HCP"
  | "Gen Z & Youth"
  | "Finance & Banking";

export interface ISupplierPanel extends Document {
  name: string;
  description?: string;

  // Direct connection to User with role = supplier
  supplierId: mongoose.Types.ObjectId;

  // Business/external supplier identifier
  supplierCode?: string;

  country?: string;
  countries?: string[];

  language?: string;
  languages?: string[];

  category: SupplierPanelCategory;

  status: SupplierPanelStatus;

  respondentCount: number;
  activeRespondentCount: number;

  targeting: {
    genders?: string[];

    ageRange?: {
      min?: number;
      max?: number;
    };

    states?: string[];
    cities?: string[];

    education?: string[];
    employment?: string[];
    occupations?: string[];

    income?: string[];
    maritalStatus?: string[];

    industries?: string[];
  };

  qualityScore: number;
  fraudRate: number;

  totalInvites: number;
  totalStarts: number;
  totalCompletes: number;
  totalTerminates: number;
  totalQuotaFull: number;
  responseRate?: number;
  activeMembers?: number;
  qualityIndex?: number;
  lastRefreshed?: Date;
  avgCompletionTime?: number;

  createdAt: Date;
  updatedAt: Date;
}

const SupplierPanelSchema = new Schema<ISupplierPanel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    /*
     * IMPORTANT
     *
     * This connects the panel directly to the supplier User account.
     *
     * SupplierPanel.supplierId === User._id
     *
     * The referenced User must have:
     * role: "supplier"
     */
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Optional business identifier.
     *
     * Example:
     * SUP-001
     */
    supplierCode: {
      type: String,
      trim: true,
      index: true,
    },

    country: {
      type: String,
      trim: true,
    },

    countries: [
      {
        type: String,
        trim: true,
      },
    ],

    language: {
      type: String,
      trim: true,
      default: "en",
    },

    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    category: {
      type: String,
      required: true,
      enum: [
        "Consumer",
        "B2B Tech",
        "Healthcare HCP",
        "Gen Z & Youth",
        "Finance & Banking",
      ],
      default: "Consumer",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "paused",
        "archived",
      ],
      default: "active",
      index: true,
    },

    respondentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeRespondentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    targeting: {
      genders: [
        {
          type: String,
        },
      ],

      ageRange: {
        min: {
          type: Number,
          min: 0,
        },

        max: {
          type: Number,
          min: 0,
        },
      },

      states: [
        {
          type: String,
        },
      ],

      cities: [
        {
          type: String,
        },
      ],

      education: [
        {
          type: String,
        },
      ],

      employment: [
        {
          type: String,
        },
      ],

      occupations: [
        {
          type: String,
        },
      ],

      income: [
        {
          type: String,
        },
      ],

      maritalStatus: [
        {
          type: String,
        },
      ],

      industries: [
        {
          type: String,
        },
      ],
    },

    qualityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    fraudRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    totalInvites: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalStarts: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCompletes: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTerminates: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQuotaFull: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Supplier -> Panels
 */
SupplierPanelSchema.index({
  supplierId: 1,
  status: 1,
});

/*
 * Supplier -> Panel name
 */
SupplierPanelSchema.index({
  supplierId: 1,
  name: 1,
});

/*
 * Supplier -> Category
 */
SupplierPanelSchema.index({
  supplierId: 1,
  category: 1,
});

/*
 * Supplier -> Country
 */
SupplierPanelSchema.index({
  supplierId: 1,
  country: 1,
});

const SupplierPanel: Model<ISupplierPanel> =
  mongoose.models.SupplierPanel ||
  mongoose.model<ISupplierPanel>(
    "SupplierPanel",
    SupplierPanelSchema
  );

export default SupplierPanel;