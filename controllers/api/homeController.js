const express = require('express');
const router = express.Router();
const path = require('path');
const Location = require('../../models/Location');

const formatError = (field, message) => ({ [field]: message });

const { languages } = require("../../config/languages");




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
        const interests = [
            "Traveling",
            "Cooking",
            "Reading",
            "Music",
            "Dancing",
            "Movies",
            "Fitness",
            "Sports",
            "Yoga",
            "Photography",
            "Painting",
            "Writing",
            "Hiking",
            "Cycling",
            "Gaming",
            "Technology",
            "Fashion",
            "Shopping",
            "Pets",
            "Gardening",
            "Meditation",
            "Volunteering",
            "Foodie",
            "Art",
            "Theater",
            "Singing",
            "Blogging",
            "DIY",
            "Crafts",
            "Fishing",
            "Camping",
            "Swimming",
            "Running",
            "Adventure Sports",
            "Collecting",
            "Investing",
            "Travel Blogging",
            "Coding",
            "Astrology",
            "History",
            "Science",
            "Languages",
            "Board Games",
            "Anime",
            "Comics",
            "Cars",
            "Motorcycles",
            "Makeup",
            "Interior Design",
            "Stand-up Comedy",
            "Podcasts",
            "Wine Tasting",
            "Beer Brewing",
            "Spirituality",
            "Photography Editing",
            "Poetry",
            "Astronomy",
            "Cooking International Food",
            "Street Food",
            "Public Speaking",
            "Social Media",
            "Karaoke"
        ];


        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const termsUrl = `${baseUrl}/api/terms`; // or `${baseUrl}/static/terms/bus-tracking-terms.html`

        return res.json({
            interests,
            terms_url: termsUrl,
            languages
        });
    } catch (err) {
        console.error('get general settings:', err.message);
        return res.status(500).json({ message: 'Server Error ' + err.message });
    }
}

