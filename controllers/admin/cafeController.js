const Cafe = require('../../models/Cafe'); // Cafe model
const Location = require('../../models/Location'); // Cafe model
const User = require('../../models/User'); // Cafe model
const Availability = require('../../models/Availability'); // Cafe model
const path = require('path');
const fs = require('fs');
const { languages } = require("../../config/languages");



exports.getList = async (req, res) => {
    try {
        res.render('admin/cafes/list', { title: "cafes" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const locations = await Location.find();
        console.log(languages);
        const partners = await User.find({ user_type: "partner", businessType: "Cafe" });
        res.render('admin/cafes/create', { title: "Create Cafe", availabilities: null, cafe: null, locations, languages, partners });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.edit = async (req, res) => {
    try {
        const locations = await Location.find();
        const cafe = await Cafe.findById(req.params.id);
        console.log("Cafe Data:", cafe);
        if (!cafe) return res.status(404).send("Cafe not found");

        const availabilities = await Availability.find({
            parentId: cafe._id,
            parentType: "Cafe"
        }).lean();

        const partners = await User.find({ user_type: "partner", businessType: "Cafe" });
        res.render('admin/cafes/create', { title: "Edit Cafe", availabilities: availabilities, cafe, locations, languages, partners });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const Cafe = await Cafe.findById(req.params.id);
        if (!Cafe) return res.status(404).send("Cafe not found");

        res.render('admin/cafes/show', { title: "Cafe Details", Cafe });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        const cafe = await Cafe.findById(req.params.id);
        if (!cafe) return res.status(404).json({ error: "Cafe not found" });

        // Delete associated availabilities
        await Availability.deleteMany({ parentId: cafe._id, parentType: "Cafe" });
        // Delete the Cafe
        await Cafe.findByIdAndDelete(req.params.id);

        res.json({ message: "Cafe deleted successfully" });
    } catch (err) {
        console.error("Error deleting Cafe:", err);
        res.status(500).json({ message: "Error deleting Cafe", error: err.message });
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

        const totalRecords = await Cafe.countDocuments();
        const filteredRecords = await Cafe.countDocuments(query);

        const data_fetch = await Cafe.find(query)
            .sort({ createdAt: -1 })
            .skip(start)
            .limit(length)
            .populate("location", "city state")
            .populate("partner") // populate partner fields
            .exec();

        const data = data_fetch.map((Cafe, index) => ({
            serial: start + index + 1,
            partner_div: `
                <div class="d-flex align-items-center">
                <div class="avatar rounded">
                    <div class="avatar-content">
                    <img src="${Cafe.partner.profile_url}" width="50" height="50" alt="Toolbar svg" />
                    </div>
                </div>
                <div>
                    <div class="fw-bolder"><a href="/admin/partners/${Cafe.partner._id}">${Cafe.partner.name}</a></div>
                    <div class="font-small-2 text-muted">${Cafe.partner.email}</div>
                    <div class="font-small-2 text-muted">${Cafe.partner.mobile}</div>
                </div>
                </div>
            `,
            name: Cafe.name,
            type: Cafe.type,
            city: Cafe.location.city ?? '',
            state: Cafe.location.state ?? '',
            address: Cafe.address,
            action: Cafe.action_div,
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
            languages,
            partner

            = [] } = req.body;

        // Basic validation
        const errors = {};

        const profile = req.files?.profile?.[0] ?? null; // uploaded profile image (if exists)


        if (!partner) errors.partner = "Cafe partner is required";
        if (!name) errors.name = "Cafe name is required";
        if (!location) errors.location = "Location is required";
        if (!address) errors.address = "Address is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const images = req.files?.images?.map(f => f.filename) || [];

        // 1️⃣ Create Cafe
        const cafe = await Cafe.create({
            name, location, address, terms, description, images, contactPerson,
            contactNumber,
            email,
            languages,
            partner,
            profile: profile ? profile.filename : "",
        });

        // 2️⃣ Create Availability (if provided)
        if (availability.length > 0) {
            const availabilityDocs = availability.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0, status, available_table }) => ({
                parentId: cafe._id,
                parentType: "Cafe",
                day,
                open_time,
                close_time,
                available_table,
                price: Number(price) || 0,
                status: status === "active" ? "active" : "inactive",
            }));

            await Availability.insertMany(availabilityDocs);
        }

        res.status(201).json({
            message: "Cafe created successfully",
            data: { cafe, availability },
        });

    } catch (err) {
        console.error("Error saving Cafe:", err);
        res.status(500).json({ error: "Failed to save Cafe. Please try again later." });
    }
};


exports.updateData = async (req, res) => {
    try {

        const profile = req.files?.profile?.[0] ?? null; // uploaded profile image (if exists)
        const CafeId = req.params.id;
        const cafe = await Cafe.findById(CafeId);
        if (!cafe) return res.status(404).json({ error: "Cafe not found" });

        const { name, location, address, terms, description, availability, contactPerson,
            contactNumber,
            languages,
            email,
            partner
            = [] } = req.body;

        // Basic validation
        const errors = {};
        if (!name) errors.name = "Cafe name is required";
        if (!partner) errors.partner = "Cafe partner is required";
        if (!location) errors.location = "Location is required";
        if (!address) errors.address = "Address is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const images = req.files?.images?.map(f => f.filename) || Cafe.images;

        cafe.contactPerson = contactPerson,
            cafe.contactNumber = contactNumber,
            cafe.email = email,

            cafe.profile = profile ? profile.filename : cafe.profile;

        cafe.name = name;
        cafe.partner = partner;
        cafe.location = location;
        cafe.languages = languages;
        cafe.address = address;
        cafe.terms = terms;
        cafe.description = description;

        await cafe.save();

        if (availability && (Array.isArray(availability) || typeof availability === "object")) {
            const availArray = Array.isArray(availability)
                ? availability
                : Object.values(availability);

            // Remove old records for this Cafe
            await Availability.deleteMany({ parentId: cafe._id, parentType: "Cafe" });

            // Insert new ones
            if (availArray.length > 0) {
                const availabilityDocs = availArray.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0, status, available_table }) => ({
                    parentId: cafe._id,
                    parentType: "Cafe",
                    day,
                    open_time,
                    close_time,
                    available_table,
                    price: Number(price) || 0,
                    late_fees: Number(late_fees) || 0,
                    status: status === "active" ? "active" : "inactive",

                }));

                await Availability.insertMany(availabilityDocs);
            }
        }

        res.status(200).json({
            message: "Cafe updated successfully",
            data: cafe,
        });

    } catch (err) {
        console.error("Error updating Cafe:", err);
        res.status(500).json({ error: "Failed to update Cafe. Please try again later." });
    }
};
