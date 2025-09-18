const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  plan_name: { type: String, required: true },  // e.g. "Starter", "Premium"
  amount: { type: Number, required: true },     // plan price
  is_free: { type: Boolean, default: false },   // free or paid plan
  description: { type: String, default: "" },   // plan details
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },

  // ✅ Limits for different services
  hostel_limit: { type: Number, default: 0 },   // how many hostels can be created
  guide_limit: { type: Number, default: 0 },    // how many guides can be managed
  rental_limit: { type: Number, default: 0 },   // how many rentals
  cafe_limit: { type: Number, default: 0 },     // how many plans

}, { timestamps: true });


planSchema.virtual("action_div").get(function () {
  return `
    <div class="dropdown">
      <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
        <i data-feather="more-vertical"></i>
      </button>
      <div class="dropdown-menu dropdown-menu-end">
        <a class="dropdown-item" href="/admin/plans/${this._id}">
          <i data-feather="eye" class="me-50"></i>
          <span>Show</span>
        </a>
        <a class="dropdown-item" href="/admin/plans/edit/${this._id}">
          <i data-feather="edit-2" class="me-50"></i>
          <span>Edit</span>
        </a>
        <a class="dropdown-item delete-plan" href="#" data-id="${this._id}" data-name="${this.name}">
          <i data-feather="trash" class="me-50"></i>
          <span>Delete</span>
        </a>
      </div>
    </div>
  `;
});

module.exports = mongoose.model("Plan", planSchema);
