const mongoose = require("mongoose");

const cafeSchema = new mongoose.Schema({
  name: { type: String, required: true },        // cafe name
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",   // <-- Name of your Location model
    required: true
  },
  profile: {
    type: String, // store filename or relative path (e.g. "uploads/profile-images/abc.jpg")
    default: ''
  },
  address: { type: String, required: true },
  terms: { type: String },                       // Terms & conditions
  description: { type: String },
  images: [{ type: String }], // array of image filenames/paths

  contactPerson: { type: String },
  contactNumber: { type: String },
  email: { type: String },
  website: { type: String },
  languages: [{ type: String }],
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   // <-- Name of your Location model
    required: true
  },
  
}, { timestamps: true });

cafeSchema.virtual('imageUrls').get(function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return this.images.map(img => `${baseUrl}/uploads/${img}`);
});





cafeSchema.virtual('profile_url').get(function () {
  // if (!this.profile) return null;

  // Use env BASE_URL or fallback to localhost
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  if (!this.profile) {
    const id = this._id ? this._id.toString().slice(-1) : 1; // last digit for variation


    const avatarNumber = (id % 5) + 1; // Results in 1 to 5


    return `${baseUrl}/avatars/avatar${avatarNumber}.png`;
  }

  // If already full URL, return as is
  if (this.profile.startsWith('http')) return this.profile;

  // Otherwise build the full URL
  const uploadPath = `/uploads/${this.profile}`;

  return `${baseUrl}${uploadPath}`;
});


cafeSchema.virtual("action_div").get(function () {
  return `
    <div class="dropdown">
      <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
        <i data-feather="more-vertical"></i>
      </button>
      <div class="dropdown-menu dropdown-menu-end">
        <a class="dropdown-item" href="/admin/cafes/${this._id}">
          <i data-feather="eye" class="me-50"></i>
          <span>Show</span>
        </a>
        <a class="dropdown-item" href="/admin/cafes/edit/${this._id}">
          <i data-feather="edit-2" class="me-50"></i>
          <span>Edit</span>
        </a>
        <a class="dropdown-item delete-cafe" href="#" data-id="${this._id}" data-name="${this.name}">
          <i data-feather="trash" class="me-50"></i>
          <span>Delete</span>
        </a>
      </div>
    </div>
  `;
});



cafeSchema.virtual("availabilities", {
  ref: "Availability",
  localField: "_id",
  foreignField: "parentId",
  justOne: false,
  match: { parentType: "Cafe" } // ensure only Rental availability is fetched
});

cafeSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.action_div;  // remove action_div from response
    return ret;
  }
});

cafeSchema.set("toObject", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.action_div;
    return ret;
  }
});

module.exports = mongoose.model("Cafe", cafeSchema);
