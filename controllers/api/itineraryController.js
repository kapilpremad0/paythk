const express = require('express');
const Guide = require('../../models/Guide');
const Availability = require('../../models/Availability');
const Itinerary = require('../../models/Itinerary');
const router = express.Router();


// Helper: Format validation error
const formatError = (field, message) => ({ [field]: message });


exports.storeData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { destination, startDate, endDate, notes } = req.body || {};
        const errors = {};
        // ✅ Destination validation
        if (!destination) {
            Object.assign(errors, { destination: "The destination field is required." });
        } else if (typeof destination !== "string") {
            Object.assign(errors, { destination: "The destination must be a string." });
        }

        // ✅ Start Date validation
        if (!startDate) {
            Object.assign(errors, { startDate: "The start date field is required." });
        } else if (isNaN(Date.parse(startDate))) {
            Object.assign(errors, { startDate: "The start date must be a valid date." });
        }

        // ✅ End Date validation
        if (!endDate) {
            Object.assign(errors, { endDate: "The end date field is required." });
        } else if (isNaN(Date.parse(endDate))) {
            Object.assign(errors, { endDate: "The end date must be a valid date." });
        } else if (new Date(endDate) < new Date(startDate)) {
            Object.assign(errors, { endDate: "The end date must be after the start date." });
        }

        // ✅ Notes validation (optional but must be string if provided)
        if (notes && typeof notes !== "string") {
            Object.assign(errors, { notes: "The notes must be a string." });
        }

        // Return errors if any
        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: "Validation Error", errors });
        }


        // ✅ Save itinerary
        const itinerary = new Itinerary({
            userId: userId,
            destination,
            startDate,
            endDate,
            notes
        });

        await itinerary.save();

        return res.status(201).json({
            message: "Itinerary created successfully",
            itinerary
        });


    } catch (err) {
        console.error("storeData error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }
}


exports.getDetailData = async (req, res) => {
    try {
        const { id } = req.params; // /guides/:id
        const { date } = req.query; // optional ?date=YYYY-MM-DD

        let dayName;
        if (date) {
            const d = new Date(date);
            dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        }

        const guide = await Guide.findById(id)
            .populate("location")
            .populate({
                path: "availabilities",
                match: dayName ? { day: dayName, status: "active" } : { status: "active" }
            });

        if (!guide) {
            return res.status(404).json({ message: "Guide not found" });
        }

        const data = guide.toObject({ virtuals: true });
        delete data.action_div; // remove action_div

        return res.json(data);
    } catch (err) {
        console.error("getData error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }

}



exports.getData = async (req, res) => {
    try {


        const { date, search, locationId, languages } = req.query;
        let dayName;

        if (date) {
            // Convert date to weekday name (Monday, Tuesday, etc.)
            const d = new Date(date);
            dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        }

        // 🔹 Build Guide filter
        let GuideFilter = {};

        if (search) {
            GuideFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ];
        }

        if (locationId) {
            GuideFilter.location = locationId;
        }

        if (languages) {
            const langArray = languages.split(",").map(l => l.trim());
            GuideFilter.languages = { $in: langArray };
        }


        const guides = await Guide.find(GuideFilter)
            .populate({
                path: "availabilities",
                match: dayName ? { day: dayName, status: "active" } : { status: "active" },
                options: { retainNullValues: true }  // keep guides even if no availabilities
            })
            .populate("location"); // keep your location join

        return res.json(guides);
    } catch (err) {
        console.error("getData error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }
};


