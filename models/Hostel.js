const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
    // Basic Details
    name: { type: String, required: true },
    type: { type: String, enum: ['Boys', 'Girls', 'Mixed'], required: true },
    address: { type: String, required: true },
    city: { type: String, required: false },
    state: { type: String },
    country: { type: String, default: 'India' },
    pinCode: { type: String },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",   // <-- Name of your Location model
        required: true
    },
    // Facilities & Amenities
    totalRooms: { type: Number, default: 0 },
    occupancyPerRoom: { type: Number, default: 1 }, // single=1, double=2, etc.
    foodFacility: { type: Boolean, default: false },
    laundryService: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    security: { type: Boolean, default: true },
    parking: { type: Boolean, default: false },

    // Contact & Management
    contactPerson: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    website: { type: String },

    // Financial Details
    monthlyFee: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['Cash', 'Bank', 'Online'], default: 'Cash' },

    // Images & Documents
    images: [{ type: String }], // array of image filenames/paths
    licenseDocument: { type: String },

    // Optional Info
    rules: { type: String },
    additionalNotes: { type: String },

}, {
    timestamps: true, // createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Example virtual to generate image URLs
HostelSchema.virtual('imageUrls').get(function () {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return this.images.map(img => `${baseUrl}/uploads/${img}`);
});

HostelSchema.virtual("licenseDocumentUrl").get(function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return this.licenseDocument
    ? `${baseUrl}/uploads/${this.licenseDocument}`
    : null;
});




HostelSchema.virtual("action_div").get(function () {
    return `
    <div class="dropdown">
      <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
        <i data-feather="more-vertical"></i>
      </button>
      <div class="dropdown-menu dropdown-menu-end">
        <a class="dropdown-item" href="/admin/hostels/${this._id}">
          <i data-feather="eye" class="me-50"></i>
          <span>Show</span>
        </a>
        <a class="dropdown-item" href="/admin/hostels/edit/${this._id}">
          <i data-feather="edit-2" class="me-50"></i>
          <span>Edit</span>
        </a>
        <a class="dropdown-item delete-hostel" href="#" data-id="${this._id}" data-name="${this.name}">
          <i data-feather="trash" class="me-50"></i>
          <span>Delete</span>
        </a>
      </div>
    </div>
  `;
});


module.exports = mongoose.model('Hostel', HostelSchema);