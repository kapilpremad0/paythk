const express = require('express');
const Cafe = require('../../models/Cafe');
const Availability = require('../../models/Availability');
const router = express.Router();


exports.getDetailData = async (req, res) => {
    try {
        const { id } = req.params; // /cafes/:id
        const { date } = req.query; // optional ?date=YYYY-MM-DD

        let dayName;
        if (date) {
            const d = new Date(date);
            dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        }

        const cafe = await Cafe.findById(id)
            .populate("location")
            .populate({
                path: "availabilities",
                match: dayName ? { day: dayName, status: "active" } : { status: "active" }
            });

        if (!cafe) {
            return res.status(404).json({ message: "Cafe not found" });
        }

        const data = cafe.toObject({ virtuals: true });
        delete data.action_div; // remove action_div

        return res.json(data);
    } catch (err) {
        console.error("getData error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }

}



exports.getData = async (req, res) => {
    try {
        const { date, search, locationId } = req.query;
        let dayName;

        if (date) {
            // Convert date to weekday name (Monday, Tuesday, etc.)
            const d = new Date(date);
            dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        }

        // 🔹 Build Cafe filter
        let CafeFilter = {};

        if (search) {
            CafeFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ];
        }

        if (locationId) {
            CafeFilter.location = locationId;
        }

        const cafes = await Cafe.find(CafeFilter)
            .populate({
                path: "availabilities",
                match: dayName ? { day: dayName, status: "active" } : { status: "active" },
                options: { retainNullValues: true }  // keep cafes even if no availabilities
            })
            .populate("location"); // keep your location join

        return res.json(cafes);
    } catch (err) {
        console.error("getData error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }
};


