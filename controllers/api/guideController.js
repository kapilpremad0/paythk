const express = require('express');
const Guide = require('../../models/Guide');
const Availability = require('../../models/Availability');
const router = express.Router();


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


