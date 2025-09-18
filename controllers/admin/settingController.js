const Setting = require('../../models/Setting'); // Cafe model
const path = require('path');
const fs = require('fs');



exports.getList = async (req, res) => {
    try {
        const settingsArray = await Setting.find({});
        const settings = {};
        settingsArray.forEach(s => { settings[s.key] = s.value; });
        res.render('admin/settings/list', { title: "Setting", settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.storeData = async (req, res) => {
    try {
        const updates = req.body; // contains all key/value pairs

        console.log(updates);

        for (const [key, value] of Object.entries(updates)) {
            await Setting.findOneAndUpdate(
                { key: key },
                { value: value },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({
            message: "Cafe created successfully",
            data: {},
        });

    } catch (err) {
        console.error("Error saving Setting:", err);
        res.status(500).json({ error: "Failed to save Cafe. Please try again later." });
    }
};