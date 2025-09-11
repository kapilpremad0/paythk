const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
    // Basic Details
    name: { type: String, required: true },
    type: { type: String, enum: ['Boys', 'Girls', 'Mixed'], required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    pinCode: { type: String },

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

module.exports = mongoose.model('Hostel', HostelSchema);