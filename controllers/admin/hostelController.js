const Hostel = require('../../models/Hostel'); // Hostel model
const Location = require('../../models/Location'); // Hostel model
const User = require('../../models/User'); // Hostel model
const path = require('path');
const fs = require('fs');
const Availability = require('../../models/Availability');

exports.getList = async (req, res) => {
  try {
    res.render('admin/hostels/list', { title: "Hostels" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const locations = await Location.find();
    const partners = await User.find({ user_type: "partner", businessType: "Hostel" });
    res.render('admin/hostels/create', { title: "Create Hostel", hostel: null, locations, partners, availabilities: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.edit = async (req, res) => {
  try {
    const locations = await Location.find();
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).send("Hostel not found");
    const partners = await User.find({ user_type: "partner", businessType: "Hostel" });

    const availabilities = await Availability.find({
      parentId: hostel._id,
      parentType: "Hostel"
    }).lean();

    console.log("Hostel Data:", hostel);
    res.render('admin/hostels/create', { title: "Edit Hostel", hostel, locations, partners, availabilities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).send("Hostel not found");

    res.render('admin/hostels/show', { title: "Hostel Details", hostel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ error: "Hostel not found" });

    // Delete uploaded files
    if (hostel.images && hostel.images.length > 0) {
      hostel.images.forEach(img => {
        const filePath = path.join(__dirname, '../../uploads/', img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }
    if (hostel.licenseDocument) {
      const filePath = path.join(__dirname, '../../uploads/', hostel.licenseDocument);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Hostel.findByIdAndDelete(req.params.id);
    res.json({ message: "Hostel deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting hostel", error: err });
  }
};

exports.getData = async (req, res) => {
  try {
    const draw = parseInt(req.body.draw) || 0;
    const start = parseInt(req.body.start) || 0;
    const length = parseInt(req.body.length) || 10;
    const search = req.body.search?.value || "";

    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { state: new RegExp(search, "i") },
      ];
    }

    const totalRecords = await Hostel.countDocuments();
    const filteredRecords = await Hostel.countDocuments(query);

    const data_fetch = await Hostel.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .populate("location", "city state")
      .populate("partner") // populate partner fields
      .exec();

    const data = data_fetch.map((hostel, index) => ({
      serial: start + index + 1,
      partner_div : `
    <div class="d-flex align-items-center">
      <div class="avatar rounded">
        <div class="avatar-content">
          <img src="${hostel.partner.profile_url}" width="50" height="50" alt="Toolbar svg" />
        </div>
      </div>
      <div>
        <div class="fw-bolder"><a href="/admin/partners/${hostel.partner._id}">${hostel.partner.name}</a></div>
        <div class="font-small-2 text-muted">${hostel.partner.email}</div>
        <div class="font-small-2 text-muted">${hostel.partner.mobile}</div>
      </div>
    </div>
  `,
      name: hostel.name,
      type: hostel.type,
      city: hostel.location.city,
      state: hostel.location.state,
      address:hostel.address,
      action: hostel.action_div,
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.storeData = async (req, res) => {
  try {
    const {
      name,
      address,
      contactPerson,
      contactNumber,
      email,
      website,
      rules,
      additionalNotes,
      location,
      partner,
      availability,
      roomTypes
    } = req.body;

    const images = req.files?.images?.map(f => f.filename) || [];
    const licenseDocument = req.files?.licenseDocument?.[0]?.filename || '';

    const errors = {};

    if (!name) errors.name = "Hostel name is required";
    if (!partner) errors.partner = "Hostel partner is required";
    // if (!city) errors.city = "City is required";
    if (!location) errors.location = "Location is required";

    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const hostel = new Hostel({

      name, contactPerson, contactNumber, email, website, address,
      rules, additionalNotes,
      images,
      licenseDocument,
      location, partner, roomTypes
    });


    await hostel.save();


    if (availability.length > 0) {
      const availabilityDocs = availability.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0, status }) => ({
        parentId: hostel._id,
        parentType: "Hostel",
        day,
        open_time,
        close_time,
        price: Number(price) || 0,
        late_fees: Number(late_fees) || 0,
        status: status === "active" ? "active" : "inactive",
      }));

      await Availability.insertMany(availabilityDocs);
    }


    res.status(201).json({ message: "Hostel created successfully", data: hostel });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save hostel. Please try again later." });
  }
};

exports.updateData = async (req, res) => {
  try {
    const hostelId = req.params.id;
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ error: "Hostel not found" });

    const {
      name,
      address,
      contactPerson,
      contactNumber,
      email,
      website,
      rules,
      additionalNotes,
      location,
      roomTypes,
      availability
    } = req.body;

    const images = req.files?.images?.map(f => f.filename) || hostel.images;
    const licenseDocument = req.files?.licenseDocument?.[0]?.filename || hostel.licenseDocument;

    hostel.name = name;
    hostel.roomTypes = roomTypes;
    hostel.address = address;

    hostel.contactPerson = contactPerson;
    hostel.contactNumber = contactNumber;
    hostel.email = email;
    hostel.website = website;


    hostel.rules = rules;
    hostel.additionalNotes = additionalNotes;
    hostel.images = images;
    hostel.licenseDocument = licenseDocument;

    await hostel.save();

    if (availability && (Array.isArray(availability) || typeof availability === "object")) {
      const availArray = Array.isArray(availability)
        ? availability
        : Object.values(availability);

      // Remove old records for this rental
      await Availability.deleteMany({ parentId: hostel._id, parentType: "Hostel" });

      // Insert new ones
      if (availArray.length > 0) {
        const availabilityDocs = availArray.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0, status }) => ({
          parentId: hostel._id,
          parentType: "Hostel",
          day,
          open_time,
          close_time,
          price: Number(price) || 0,
          late_fees: Number(late_fees) || 0,
          status: status === "active" ? "active" : "inactive",

        }));

        await Availability.insertMany(availabilityDocs);
      }
    }



    res.status(200).json({ message: "Hostel updated successfully", data: hostel });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update hostel. Please try again later." });
  }
};
