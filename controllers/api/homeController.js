const express = require('express');
const router = express.Router();
const path = require('path');
const Location = require('../../models/Location');

const formatError = (field, message) => ({ [field]: message });





exports.termsPage = (req, res) => {
    const filePath = path.join(__dirname, '../public/frontend/terms.html');
    res.sendFile(filePath);
};

exports.getLocations = async (req, res) => {
    try {
        const { search } = req.query; // check if request has ?search=

        let query = {};

        if (search) {
            query = {
                $or: [
                    { city: { $regex: search, $options: "i" } },  // case-insensitive search
                    { state: { $regex: search, $options: "i" } }
                ]
            };
        }
        const locations = await Location.find(query);
        return res.json(locations);
    } catch (err) {
        console.error('get general settings:', err.message);
        return res.status(500).json({ message: 'Server Error ' + err.message });
    }
}


exports.generalSettings = async (req, res) => {
    try {
        const leaveReasons = [
            "Personal reasons",
            "Medical or health issues",
            "Family emergency",
            "Vacation or holiday",
            "Maternity/Paternity leave",
            "Bereavement leave",
            "Marriage leave",
            "Relocation",
            "Official work or training",
            "Other"
        ];
        const passengerReasons = [
            "Need to attend to a quick errand",
            "Waiting for someone to arrive",
            "Change of destination",
            "Taking a short break",
            "Phone call or emergency",
            "Vehicle issue reported",
            "Feeling unwell",
            "Other"
        ];

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const termsUrl = `${baseUrl}/api/terms`; // or `${baseUrl}/static/terms/bus-tracking-terms.html`

        return res.json({
            pause_ride_reason: passengerReasons,
            leave_request_reasons: leaveReasons,
            terms_url: termsUrl
        });
    } catch (err) {
        console.error('get general settings:', err.message);
        return res.status(500).json({ message: 'Server Error ' + err.message });
    }
}

