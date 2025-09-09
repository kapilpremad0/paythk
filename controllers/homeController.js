const express = require('express');
const router = express.Router();
const path = require('path');

const formatError = (field, message) => ({ [field]: message });





exports.termsPage = (req, res) => {
    const filePath = path.join(__dirname, '../public/frontend/terms.html');
    res.sendFile(filePath);
};


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

