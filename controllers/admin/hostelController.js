const Hostel = require('../../models/Hostel'); // Hostel model
const path = require('path');
const fs = require('fs');

exports.getList = async (req, res) => {
  try {
    res.render('admin/hostels/list', { title: "Hostels" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.render('admin/hostels/create', { title: "Create Hostel", hostel: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.edit = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).send("Hostel not found");
    res.render('admin/hostels/create', { title: "Edit Hostel", hostel });
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
      .exec();

    const data = data_fetch.map((hostel, index) => ({
      serial: start + index + 1,
      name: hostel.name,
      type: hostel.type,
      city: hostel.city,
      state: hostel.state,
      contactPerson: hostel.contactPerson,
      contactNumber: hostel.contactNumber,
      monthlyFee: hostel.monthlyFee,
      action: `<a href="/admin/hostels/edit/${hostel._id}">Edit</a> | <a href="#" onclick="deleteHostel('${hostel._id}')">Delete</a>`
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
      type,
      address,
      city,
      state,
      country,
      pinCode,
      totalRooms,
      occupancyPerRoom,
      foodFacility,
      laundryService,
      wifi,
      security,
      parking,
      contactPerson,
      contactNumber,
      email,
      website,
      monthlyFee,
      depositAmount,
      paymentMode,
      rules,
      additionalNotes
    } = req.body;

    const images = req.files?.images?.map(f => f.filename) || [];
    const licenseDocument = req.files?.licenseDocument?.[0]?.filename || '';

    const errors = {};

    if (!name) errors.name = "Hostel name is required";
    if (!city) errors.city = "City is required";
    if (!totalRooms) errors.totalRooms = "Total rooms is required";

    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const hostel = new Hostel({
      name, type, address, city, state, country, pinCode,
      totalRooms, occupancyPerRoom,
      foodFacility: !!foodFacility,
      laundryService: !!laundryService,
      wifi: !!wifi,
      security: !!security,
      parking: !!parking,
      contactPerson, contactNumber, email, website,
      monthlyFee, depositAmount, paymentMode,
      rules, additionalNotes,
      images,
      licenseDocument
    });

    await hostel.save();
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
      type,
      address,
      city,
      state,
      country,
      pinCode,
      totalRooms,
      occupancyPerRoom,
      foodFacility,
      laundryService,
      wifi,
      security,
      parking,
      contactPerson,
      contactNumber,
      email,
      website,
      monthlyFee,
      depositAmount,
      paymentMode,
      rules,
      additionalNotes
    } = req.body;

    const images = req.files?.images?.map(f => f.filename) || hostel.images;
    const licenseDocument = req.files?.licenseDocument?.[0]?.filename || hostel.licenseDocument;

    hostel.name = name;
    hostel.type = type;
    hostel.address = address;
    hostel.city = city;
    hostel.state = state;
    hostel.country = country;
    hostel.pinCode = pinCode;
    hostel.totalRooms = totalRooms;
    hostel.occupancyPerRoom = occupancyPerRoom;
    hostel.foodFacility = !!foodFacility;
    hostel.laundryService = !!laundryService;
    hostel.wifi = !!wifi;
    hostel.security = !!security;
    hostel.parking = !!parking;
    hostel.contactPerson = contactPerson;
    hostel.contactNumber = contactNumber;
    hostel.email = email;
    hostel.website = website;
    hostel.monthlyFee = monthlyFee;
    hostel.depositAmount = depositAmount;
    hostel.paymentMode = paymentMode;
    hostel.rules = rules;
    hostel.additionalNotes = additionalNotes;
    hostel.images = images;
    hostel.licenseDocument = licenseDocument;

    await hostel.save();
    res.status(200).json({ message: "Hostel updated successfully", data: hostel });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update hostel. Please try again later." });
  }
};
