const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    type: {
      type: String,
      enum: ["flat", "percentage"], // discount type
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    maxDiscount: {
      type: Number,
      default: 0,
    },

    minPurchase: {
      type: Number,
      default: 0,
    },

    usageLimit: {
      type: Number,
      default: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    perUserLimit: {
      type: Number,
      default: 1,
    },

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validTo: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ✅ Coupon category (Rental, Hostel, Cafe, Guide)
    couponFor: {
      type: String,
      enum: ["Rental", "Hostel", "Cafe", "Guide"],
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

couponSchema.pre("save", async function (next) {
  if (!this.code) {
    // Mapping prefix for couponFor
    const prefixMap = {
      Rental: "RENT",
      Hostel: "HOST",
      Guide: "GUID",
    };

    const prefix = prefixMap[this.couponFor] || "COUP";

    // Generate 6 random alphanumeric chars
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    this.code = `${prefix}${randomPart}`;
  }
  next();
});


couponSchema.virtual("action_div").get(function () {
  return `
    <div class="dropdown">
      <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
        <i data-feather="more-vertical"></i>
      </button>
      <div class="dropdown-menu dropdown-menu-end">
        <a class="dropdown-item" href="/admin/coupons/${this._id}">
          <i data-feather="eye" class="me-50"></i>
          <span>Show</span>
        </a>
        <a class="dropdown-item" href="/admin/coupons/edit/${this._id}">
          <i data-feather="edit-2" class="me-50"></i>
          <span>Edit</span>
        </a>
        <a class="dropdown-item delete-coupon" href="#" data-id="${this._id}" data-name="${this.name}">
          <i data-feather="trash" class="me-50"></i>
          <span>Delete</span>
        </a>
      </div>
    </div>
  `;
});

module.exports = mongoose.model("Coupon", couponSchema);
