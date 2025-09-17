const Transaction = require('../../models/Wallet'); // Cafe model
const Location = require('../../models/Location'); // Cafe model
const Availability = require('../../models/Availability'); // Cafe model
const path = require('path');
const fs = require('fs');
const { languages } = require("../../config/languages");



exports.getList = async (req, res) => {
    try {
        res.render('admin/transactions/list', { title: "Transactions" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




exports.getData = async (req, res) => {
    try {
        const draw = parseInt(req.body.draw) || 0;
        const start = parseInt(req.body.start) || 0;
        const length = parseInt(req.body.length) || 10;
        const search = req.body.search?.value || "";

        const query = {};

        // 🔍 Search in user name, reason, description
        if (search) {
            query.$or = [
                { reason: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
            ];
        }

        const totalRecords = await Transaction.countDocuments();
        const filteredRecords = await Transaction.countDocuments(query);

        const data_fetch = await Transaction.find(query)
            .populate("userId", "name email mobile") // get user details
            .sort({ createdAt: -1 })
            .skip(start)
            .limit(length)
            .exec();

        const data = data_fetch.map((tx, index) => ({
            serial: start + index + 1,
            user: tx.userId ? tx.userId.name : "N/A",
            amount: tx.amount,
            type: tx.type,
            reason: tx.reason || "",
            description: tx.description || "",
            balance_after: tx.balance_after,
            createdAt: tx.createdAt ,
        }));

        res.json({
            draw,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data
        });
    } catch (err) {
        console.error("Transaction getData Error:", err);
        res.status(500).json({ error: err.message });
    }
};
