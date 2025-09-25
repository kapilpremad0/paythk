const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  bikeName: { type: String, required: true },
  price: { type: Number, required: true },
  helmet: { type: Boolean, default: false },
  maxSpeed: { type: Number },
  person: { type: Number },
  images: [String] // store file paths or URLs
});


const rentalSchema = new mongoose.Schema({
  name: { type: String, required: true },        // Rental name
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",   // <-- Name of your Location model
    required: true
  },
  address: { type: String, required: true },
  terms: { type: String },                       // Terms & conditions
  description: { type: String },
  images: [{ type: String }], // array of image filenames/paths

  contactPerson: { type: String },
  contactNumber: { type: String },
  email: { type: String },
  website: { type: String },
  vehicles: [vehicleSchema], // <-- new field
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   // <-- Name of your Location model
    required: true
  },

}, { timestamps: true });

rentalSchema.virtual("availabilities", {
  ref: "Availability",
  localField: "_id",
  foreignField: "parentId",
  justOne: false,
  match: { parentType: "Rental" } // ensure only Rental availability is fetched
});

rentalSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.action_div;  // remove action_div from response
    return ret;
  }
});

rentalSchema.set("toObject", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.action_div;
    return ret;
  }
});


rentalSchema.virtual('imageUrls').get(function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return this.images.map(img => `${baseUrl}/uploads/${img}`);
});


rentalSchema.virtual("action_div").get(function () {
  return `
    <div class="dropdown">
      <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
        <i data-feather="more-vertical"></i>
      </button>
      <div class="dropdown-menu dropdown-menu-end">
        <a class="dropdown-item" href="/admin/rentals/${this._id}">
          <i data-feather="eye" class="me-50"></i>
          <span>Show</span>
        </a>
        <a class="dropdown-item" href="/admin/rentals/edit/${this._id}">
          <i data-feather="edit-2" class="me-50"></i>
          <span>Edit</span>
        </a>
        <a class="dropdown-item delete-rental" href="#" data-id="${this._id}" data-name="${this.name}">
          <i data-feather="trash" class="me-50"></i>
          <span>Delete</span>
        </a>
      </div>
    </div>
  `;
});

module.exports = mongoose.model("Rental", rentalSchema);
