const express = require('express');
const Rental = require('../../models/Rental');
const Availability = require('../../models/Availability');
const router = express.Router();


exports.getDetailData = async (req, res) => {
    try {
        const { id } = req.params; // /rentals/:id
        const { date } = req.query; // optional ?date=YYYY-MM-DD

        let dayName;
        if (date) {
            const d = new Date(date);
            dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        }

        const rental = await Rental.findById(id)
            .populate("location")
            .populate({
                path: "availabilities",
                match: dayName ? { day: dayName, status: "active" } : { status: "active" }
            });

        if (!rental) {
            return res.status(404).json({ message: "Rental not found" });
        }

        const data = rental.toObject({ virtuals: true });
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

        // 🔹 Build rental filter
        let rentalFilter = {};

        if (search) {
            rentalFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } }
            ];
        }

        if (locationId) {
            rentalFilter.location = locationId;
        }

        const rentals = await Rental.find(rentalFilter)
            .populate({
                path: "availabilities",
                match: dayName ? { day: dayName, status: "active" } : { status: "active" },
                options: { retainNullValues: true }  // keep rentals even if no availabilities
            })
            .populate("location"); // keep your location join

        return res.json(rentals);
    } catch (err) {
        console.error("getData error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }
};


