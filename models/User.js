const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  user_type: {
    type: String,
    enum: ['customer', 'driver', 'admin'],
    default: 'customer'
  },
  otp_verify: {
    type: Boolean,
    default: false   // false = not verified, true = verified
  },
  terms_conditions: {
    type: Boolean,
    default: false   // false = not verified, true = verified
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  email: { type: String, default: null }, // Gmail address
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null
  },
  dob: { type: Date, default: null }, // Date of birth
  password: {
    type: String,
    required: true
  },
  profile: {
    type: String, // store filename or relative path (e.g. "uploads/profile-images/abc.jpg")
    default: ''
  },
  otp: { type: String },
  otpExpiry: { type: Date },

  ssn: { type: String, default: null },
  emergencyContact: { type: String, default: null },
  homeAddress: { type: String, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


UserSchema.virtual('dob_formatted').get(function () {
  if (!this.dob) return null;

  const date = new Date(this.dob);

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
});
// Virtual to generate full profile image URL
UserSchema.virtual('profile_url').get(function () {
  // if (!this.profile) return null;

  // Use env BASE_URL or fallback to localhost
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  if (!this.profile) {
    const id = this._id ? this._id.toString().slice(-1) : 1; // last digit for variation
    const gender = this.gender;

    const avatarNumber = (id % 5) + 1; // Results in 1 to 5
    if (avatarNumber == 'NaN') {
      avatarNumber = 3;
    }
    if (gender === 'female') {


      return `${baseUrl}/avatars/avatar-f${avatarNumber}.png`;
    } else if (gender === 'other') {
      return `${baseUrl}/avatars/gender-symbol.png`;
    } else {
      return `${baseUrl}/avatars/avatar${avatarNumber}.png`;
    }
  }

  // If already full URL, return as is
  if (this.profile.startsWith('http')) return this.profile;

  // Otherwise build the full URL
  const uploadPath = `/uploads/${this.profile}`;

  return `${baseUrl}${uploadPath}`;
});

UserSchema.virtual('document_urls').get(function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  // Convert to plain object to remove mongoose prototype methods
  const docsRaw = this.documents ? this.documents.toObject() : {};
  const docs = {};

  for (let key in docsRaw) {
    const val = docsRaw[key];

    if (typeof val === 'string' && val.trim() !== '') {
      docs[key] = val.startsWith('http')
        ? val
        : `${baseUrl}/uploads/${val}`;
    } else {
      docs[key] = null;
    }
  }

  return docs;
});



UserSchema.virtual("name_div").get(function () {
  return `
    <div class="d-flex align-items-center">
      <div class="avatar rounded">
        <div class="avatar-content">
          <img src="${this.profile_url}" width="50" height="50" alt="Toolbar svg" />
        </div>
      </div>
      <div>
        <div class="fw-bolder"><a href="/admin/users/${this._id}">${this.name}</a></div>
        <div class="font-small-2 text-muted">${this.email}</div>
        <div class="font-small-2 text-muted">${this.mobile}</div>
      </div>
    </div>
  `;
});

// ✅ Virtual for action dropdown
UserSchema.virtual("action_div").get(function () {
  return `
    <div class="dropdown">
      <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
        <i data-feather="more-vertical"></i>
      </button>
      <div class="dropdown-menu dropdown-menu-end">
        <a class="dropdown-item" href="/admin/users/${this._id}">
          <i data-feather="eye" class="me-50"></i>
          <span>Show</span>
        </a>
        <a class="dropdown-item" href="/admin/users/edit/${this._id}">
          <i data-feather="edit-2" class="me-50"></i>
          <span>Edit</span>
        </a>
        <a class="dropdown-item delete-user" href="#" data-id="${this._id}" data-name="${this.name}">
          <i data-feather="trash" class="me-50"></i>
          <span>Delete</span>
        </a>
      </div>
    </div>
  `;
});

module.exports = mongoose.model('User', UserSchema);
