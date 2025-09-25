const Rental = require('../../models/Rental'); // Rental model
const Location = require('../../models/Location'); // Rental model
const Availability = require('../../models/Availability'); // Rental model
const path = require('path');
const fs = require('fs');
const User = require('../../models/User');

exports.getList = async (req, res) => {
  try {
    res.render('admin/rentals/list', { title: "rentals" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const locations = await Location.find();
    const partners = await User.find({ user_type: "partner", businessType: "Rental" });
    
    res.render('admin/rentals/create', { title: "Create Rental", availabilities: null, rental: null, locations ,partners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.edit = async (req, res) => {
  try {
    const locations = await Location.find();
    const rental = await Rental.findById(req.params.id);
    console.log("Rental Data:", rental);
    if (!rental) return res.status(404).send("Rental not found");

    const availabilities = await Availability.find({
      parentId: rental._id,
      parentType: "Rental"
    }).lean();

    const partners = await User.find({ user_type: "partner", businessType: "Rental" });


    res.render('admin/rentals/create', { title: "Edit Rental", availabilities: availabilities, rental, locations ,partners});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const Rental = await Rental.findById(req.params.id);
    if (!Rental) return res.status(404).send("Rental not found");

    res.render('admin/rentals/show', { title: "Rental Details", Rental });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: "Rental not found" });

    // Delete associated availabilities
    await Availability.deleteMany({ parentId: rental._id, parentType: "Rental" });
    // Delete the rental
    await Rental.findByIdAndDelete(req.params.id);

    res.json({ message: "Rental deleted successfully" });
  } catch (err) {
    console.error("Error deleting rental:", err);
    res.status(500).json({ message: "Error deleting Rental", error: err.message });
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

    const totalRecords = await Rental.countDocuments();
    const filteredRecords = await Rental.countDocuments(query);

    const data_fetch = await Rental.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .populate("location", "city state")
      .populate("partner") // populate partner fields
      .exec();

    const data = data_fetch.map((Rental, index) => ({
      serial: start + index + 1,
      partner_div : `
    <div class="d-flex align-items-center">
      <div class="avatar rounded">
        <div class="avatar-content">
          <img src="${Rental.partner.profile_url}" width="50" height="50" alt="Toolbar svg" />
        </div>
      </div>
      <div>
        <div class="fw-bolder"><a href="/admin/partners/${Rental.partner._id}">${Rental.partner.name}</a></div>
        <div class="font-small-2 text-muted">${Rental.partner.email}</div>
        <div class="font-small-2 text-muted">${Rental.partner.mobile}</div>
      </div>
    </div>
  `,
      name: Rental.name,
      type: Rental.type,
      city: Rental.location.city ?? '',
      state: Rental.location.state ?? '',
      address: Rental.address,
      action: Rental.action_div,
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
    const { name, location, address, terms, description, availability,
      contactPerson,
      contactNumber,
      email,
      website ,partner ,vehicles

      = [] } = req.body;

    // Basic validation
    const errors = {};
    if (!name) errors.name = "Rental name is required";
    if (!partner) errors.partner = "Rental partner is required";
    if (!location) errors.location = "Location is required";
    if (!address) errors.address = "Address is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const images = req.files?.images?.map(f => f.filename) || [];

    // 1️⃣ Create Rental
    const rental = await Rental.create({
      name, location, address, terms, description, images, contactPerson,
      contactNumber,
      email,
      website ,partner ,vehicles
    });

    // 2️⃣ Create Availability (if provided)
    if (availability.length > 0) {
      const availabilityDocs = availability.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0 ,status}) => ({
        parentId: rental._id,
        parentType: "Rental",
        day,
        open_time,
        close_time,
        price: Number(price) || 0,
        late_fees: Number(late_fees) || 0,
        status: status === "active" ? "active" : "inactive",
      }));

      await Availability.insertMany(availabilityDocs);
    }

    res.status(201).json({
      message: "Rental created successfully",
      data: { rental, availability },
    });

  } catch (err) {
    console.error("Error saving rental:", err);
    res.status(500).json({ error: "Failed to save Rental. Please try again later." });
  }
};


exports.updateData = async (req, res) => {
  try {
    const rentalId = req.params.id;
    const rental = await Rental.findById(rentalId);
    if (!rental) return res.status(404).json({ error: "Rental not found" });

    const { name, location, address, terms, description, availability, contactPerson,
      contactNumber,
      email,
      partner,
      vehicles,
      website = [] } = req.body;

    // Basic validation
    const errors = {};
    if (!name) errors.name = "Rental name is required";
    if (!partner) errors.partner = "Rental partner is required";
    if (!location) errors.location = "Location is required";
    if (!address) errors.address = "Address is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const images = req.files?.images?.map(f => f.filename) || rental.images;

    rental.contactPerson = contactPerson,
    rental.contactNumber = contactNumber,
    rental.email = email,
    rental.website = website,

    rental.name = name;
    rental.location = location;
    rental.address = address;
    rental.terms = terms;
    rental.description = description;
    rental.partner = partner;
    rental.vehicles = vehicles;

    await rental.save();

    if (availability && (Array.isArray(availability) || typeof availability === "object")) {
      const availArray = Array.isArray(availability)
        ? availability
        : Object.values(availability);

      // Remove old records for this rental
      await Availability.deleteMany({ parentId: rental._id, parentType: "Rental" });

      // Insert new ones
      if (availArray.length > 0) {
        const availabilityDocs = availArray.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0 ,status}) => ({
          parentId: rental._id,
          parentType: "Rental",
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

    res.status(200).json({
      message: "Rental updated successfully",
      data: rental,
    });

  } catch (err) {
    console.error("Error updating rental:", err);
    res.status(500).json({ error: "Failed to update Rental. Please try again later." });
  }
};
