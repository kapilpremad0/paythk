const express = require('express');
const User = require('../../models/User');
const LikeDislike = require('../../models/LikeDislike');
const Availability = require('../../models/Availability');
const BuddyRequest = require('../../models/BuddyRequest');
const router = express.Router();

const formatError = (field, message) => ({ [field]: message });



exports.getData = async (req, res) => {
    try {

        const userId = req.user.id;
        const { search, minAge, maxAge, interests } = req.query;

        let UserFilter = { user_type: "customer" };

        // 🔹 Text search on name & bio
        if (search) {
            UserFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { bio: { $regex: search, $options: "i" } }
            ];
        }

        // 🔹 Age filter using DOB
        if (minAge || maxAge) {
            const today = new Date();
            let dobFilter = {};

            if (minAge) {
                const maxDob = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
                dobFilter.$lte = maxDob;
            }

            if (maxAge) {
                const minDob = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate() + 1);
                dobFilter.$gte = minDob;
            }

            UserFilter.dob = dobFilter;
        }

        // 🔹 Interests filter
        if (interests) {
            const interestArray = interests.split(",").map(i => i.trim());
            UserFilter.interests = { $in: interestArray };
        }

        // 🔹 Fetch buddies and convert to plain objects
        const buddies = await User.find(UserFilter).lean({ virtuals: true });

        // 🔹 Fetch like/dislike actions of logged-in user
        const actions = await LikeDislike.find({
            userId: userId,
            buddyId: { $in: buddies.map(b => b._id) }
        }).lean();

        const finalData = buddies.map(buddy => ({
            ...buddy,
            myAction: actions.find(a => a.buddyId.toString() === buddy._id.toString())?.action || null
        }));

        return res.json(finalData); // <-- return finalData, not buddies
    } catch (err) {
        console.error("findBuddies error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }
};


exports.likeDislike = async (req, res) => {
    try {
        const errors = {};
        const userId = req.user.id;        // logged-in user
        const { buddyId, action } = req.body || {}; // buddyId and action ("like" or "dislike")

        if (!buddyId) {
            Object.assign(errors, formatError('buddyId', 'The buddyId field is required.'));
        }

        if (!action) {
            Object.assign(errors, formatError('action', 'The action field is required.'));
        } else if (!["like", "dislike"].includes(action)) {
            Object.assign(errors, formatError('action', "Invalid action. Must be 'like' or 'dislike'"));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // 🔹 Prevent user from liking/disliking themselves
        if (userId === buddyId) {
            return res.status(400).json({ message: "You cannot like or dislike yourself" });
        }

        // 🔹 Upsert: create or update the action
        const record = await LikeDislike.findOneAndUpdate(
            { userId, buddyId },
            { action, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return res.json({ message: `You have ${action}d this buddy`, record });
    } catch (err) {
        console.error("likeDislikeBuddy error:", err.message);
        return res.status(500).json({ message: "Server Error" });
    }
};



exports.sendRequest = async (req, res) => {
    try {
        const errors = {};
        const senderId = req.user.id;
        const { buddyId } = req.body || {};



        if (!buddyId) {
            Object.assign(errors, formatError('buddyId', 'The buddyId field is required.'));
        }


        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        if (senderId === buddyId) {
            return res.status(400).json({ message: "Cannot send request to yourself" });
        }

        const request = await BuddyRequest.findOneAndUpdate(
            { senderId, receiverId: buddyId },
            { status: "pending", updatedAt: new Date() },
            { upsert: true, new: true }
        );

        return res.json({ message: "Request sent", request });
    } catch (err) {
        console.error("sendRequest error:", err.message);
        return res.status(500).json({ message: "Server Error" });
    }
};


exports.getRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Requests you RECEIVED
        const received = await BuddyRequest.find({ receiverId: userId })
            .populate("senderId", "name dob interests imageUrls")
            .populate("receiverId", "name");

        // Requests you SENT
        const sent = await BuddyRequest.find({ senderId: userId })
            .populate("receiverId", "name dob interests imageUrls")
            .populate("senderId", "name");

        return res.json({
            sentRequests: sent,
            receivedRequests: received
        });
    } catch (err) {
        console.error("getPendingRequests error:", err.message);
        return res.status(500).json({ message: "Server Error" });
    }
};


