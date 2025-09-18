const Guide = require('../../models/Guide'); // Guide model
const Location = require('../../models/Location'); // Guide model
const Availability = require('../../models/Availability'); // Guide model
const path = require('path');
const fs = require('fs');
const { languages } = require("../../config/languages");



exports.getList = async (req, res) => {
    try {
        res.render('admin/guides/list', { title: "guides" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const locations = await Location.find();
        console.log(languages);
        res.render('admin/guides/create', { title: "Create Guide", availabilities: null, guide: null, locations, languages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.edit = async (req, res) => {
    try {
        const locations = await Location.find();
        const guide = await Guide.findById(req.params.id);
        console.log("Guide Data:", guide);
        if (!guide) return res.status(404).send("Guide not found");

        const availabilities = await Availability.find({
            parentId: guide._id,
            parentType: "Guide"
        }).lean();


        res.render('admin/guides/create', { title: "Edit Guide", availabilities: availabilities, guide, locations, languages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const Guide = await Guide.findById(req.params.id);
        if (!Guide) return res.status(404).send("Guide not found");

        res.render('admin/guides/show', { title: "Guide Details", Guide });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.id);
        if (!guide) return res.status(404).json({ error: "Guide not found" });

        // Delete associated availabilities
        await Availability.deleteMany({ parentId: guide._id, parentType: "Guide" });
        // Delete the Guide
        await Guide.findByIdAndDelete(req.params.id);

        res.json({ message: "Guide deleted successfully" });
    } catch (err) {
        console.error("Error deleting Guide:", err);
        res.status(500).json({ message: "Error deleting Guide", error: err.message });
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

        const totalRecords = await Guide.countDocuments();
        const filteredRecords = await Guide.countDocuments(query);

        const data_fetch = await Guide.find(query)
            .sort({ createdAt: -1 })
            .skip(start)
            .limit(length)
            .populate("location", "city state")
            .exec();

        const data = data_fetch.map((Guide, index) => ({
            serial: start + index + 1,
            name: Guide.name,
            type: Guide.type,
            city: Guide.location.city ?? '',
            state: Guide.location.state ?? '',
            address: Guide.address,
            action: Guide.action_div,
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
            languages

            = [] } = req.body;

        // Basic validation
        const errors = {};

        const profile = req.files?.profile?.[0] ?? null; // uploaded profile image (if exists)


        if (!name) errors.name = "Guide name is required";
        if (!location) errors.location = "Location is required";
        if (!address) errors.address = "Address is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const images = req.files?.images?.map(f => f.filename) || [];

        // 1️⃣ Create Guide
        const guide = await Guide.create({
            name, location, address, terms, description, images, contactPerson,
            contactNumber,
            email,
            languages,
            profile: profile ? profile.filename : "",
        });

        // 2️⃣ Create Availability (if provided)
        if (availability.length > 0) {
            const availabilityDocs = availability.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0, status }) => ({
                parentId: guide._id,
                parentType: "Guide",
                day,
                open_time,
                close_time,
                price: Number(price) || 0,
                status: status === "active" ? "active" : "inactive",
            }));

            await Availability.insertMany(availabilityDocs);
        }

        res.status(201).json({
            message: "Guide created successfully",
            data: { Guide, availability },
        });

    } catch (err) {
        console.error("Error saving Guide:", err);
        res.status(500).json({ error: "Failed to save Guide. Please try again later." });
    }
};


exports.updateData = async (req, res) => {
    try {

        const profile = req.files?.profile?.[0] ?? null; // uploaded profile image (if exists)
        const GuideId = req.params.id;
        const guide = await Guide.findById(GuideId);
        if (!guide) return res.status(404).json({ error: "Guide not found" });

        const { name, location, address, terms, description, availability, contactPerson,
            contactNumber,
            languages,
            email
            = [] } = req.body;

        // Basic validation
        const errors = {};
        if (!name) errors.name = "Guide name is required";
        if (!location) errors.location = "Location is required";
        if (!address) errors.address = "Address is required";

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const images = req.files?.images?.map(f => f.filename) || Guide.images;

        guide.contactPerson = contactPerson,
            guide.contactNumber = contactNumber,
            guide.email = email,

            guide.profile = profile ? profile.filename : guide.profile;

        guide.name = name;
        guide.location = location;
        guide.languages = languages;
        guide.address = address;
        guide.terms = terms;
        guide.description = description;

        await guide.save();

        if (availability && (Array.isArray(availability) || typeof availability === "object")) {
            const availArray = Array.isArray(availability)
                ? availability
                : Object.values(availability);

            // Remove old records for this Guide
            await Availability.deleteMany({ parentId: guide._id, parentType: "Guide" });

            // Insert new ones
            if (availArray.length > 0) {
                const availabilityDocs = availArray.map(({ day, open_time = "", close_time = "", price = 0, late_fees = 0, status }) => ({
                    parentId: guide._id,
                    parentType: "Guide",
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
            message: "Guide updated successfully",
            data: Guide,
        });

    } catch (err) {
        console.error("Error updating Guide:", err);
        res.status(500).json({ error: "Failed to update Guide. Please try again later." });
    }
};
