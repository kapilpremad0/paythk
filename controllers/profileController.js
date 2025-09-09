const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios');


// Helper: Format validation error
const formatError = (field, message) => ({ [field]: message });

exports.updateAddress = async (req, res) => {
    try {
        const { mobile, type, address } = req.body || {};
        const errors = {};

        const userId = req.user.id;
        // Validate inputs

        if (!type || !['default', 'secondary'].includes(type)) {
            Object.assign(errors, formatError('type', 'Type must be "default" or "secondary".'));
        }
        if (!address || typeof address !== 'object') {
            Object.assign(errors, formatError('address', 'Address must be provided as an object.'));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }


        // Find user
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Merge new address fields into existing one
        if (type === 'default') {
            user.defaultAddress = { ...user.defaultAddress.toObject(), ...address };
        } else {
            user.secondaryAddress = { ...user.secondaryAddress.toObject(), ...address };
        }

        await user.save();

        return res.json({
            message: `${type} address updated successfully.`,
            success: true,
            user
        });

    } catch (err) {
        console.error("Update Address Error:", err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
};


exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, gender, email, dob, ssn, emergencyContact, homeAddress, driverCredentials ,terms_conditions } = req.body || {};
    const errors = {};


    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (driverCredentials && typeof driverCredentials !== 'object') {
            Object.assign(errors, formatError('driverCredentials', 'Driver Credentials must be provided as an object.'));
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ message: 'Validation Error', errors });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (gender) user.gender = gender;
        
        if (dob) user.dob = dob;
        if (ssn) user.ssn = ssn;
        if (terms_conditions) user.terms_conditions = terms_conditions;
        if (emergencyContact) user.emergencyContact = emergencyContact;
        if (homeAddress) user.homeAddress = homeAddress;

        if (req.files?.profile) {
            user.profile = req.files.profile[0].filename;
        }
        if (req.files?.licenseFront) {
            user.documents.licenseFront = req.files.licenseFront[0].filename;
        }
        if (req.files?.licenseBack) {
            user.documents.licenseBack = req.files.licenseBack[0].filename;
        }
        if (req.files?.addressFront) {
            user.documents.addressFront = req.files.addressFront[0].filename;
        }
        if (req.files?.addressBack) {
            user.documents.addressBack = req.files.addressBack[0].filename;
        }

        user.driverCredentials = { ...user.driverCredentials.toObject(), ...driverCredentials };



        await user.save();

        return res.json({
            message: 'Profile updated successfully',
            user: user
        });
    } catch (err) {
        console.error('Update Profile:', err.message);
        return res.status(500).json({ message: 'Server Error' });
    }
};


exports.getProfile = async (req, res) => {
    const userId = req.user.id; // assuming authentication middleware sets req.user

    try {
        const user = await User.findById(userId).select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        return res.json({
            message: "Profile data fetch successfully",
            user
        });
    } catch (err) {
        console.error('Get Profile Data:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
}


exports.deleteProfile = async (req, res) => {
    const userId = req.user.id; // assuming authentication middleware sets req.user

    try {
        const user = await User.findById(userId).select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.profile) {
            // remove from DB
            user.profile = null;
            await user.save();
        }


        return res.json({
            message: "Profile data fetch successfully",
            user
        });
    } catch (err) {
        console.error('Get Profile Data:', err.message);
        return res.status(500).json({
            message: 'Server Error',
            success: false
        });
    }
}


exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you're using auth middleware to set req.user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



// const GOOGLE_API_KEY = 'AIzaSyAkGQ0Qw38V0MR-_kCBw_vOKOd3-yhUA5Q';

// Sample passengers (pickup & drop-off)
// const passengers = [
//     { id: 1, pickup: { lat: 28.7041, lng: 77.1025 }, drop: { lat: 28.5355, lng: 77.3910 } },
//     { id: 2, pickup: { lat: 28.6139, lng: 77.2090 }, drop: { lat: 28.4595, lng: 77.0266 } },
//     // ... up to 30 passengers
// ];

// google

// exports.optimizeBusRoute = async (req, res) => {
//   try {
//     // 1. Prepare waypoints for Google Directions API
//     let waypoints = [];
//     passengers.forEach(p => {
//       waypoints.push(`${p.pickup.lat},${p.pickup.lng}`);
//       waypoints.push(`${p.drop.lat},${p.drop.lng}`);
//     });

//     // 2. Request optimized route from Google
//     const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${waypoints[0]}&destination=${waypoints[waypoints.length - 1]}&waypoints=optimize:true|${waypoints.slice(1, -1).join('|')}&key=${GOOGLE_API_KEY}`;

//     const { data } = await axios.get(directionsUrl);

//     if (data.status !== 'OK') {
//       return res.status(400).json({ error: data.error_message || 'Failed to optimize route' });
//     }

//     // 3. Extract optimized order & route info
//     const optimizedOrder = data.routes[0].waypoint_order;
//     const routeOverview = data.routes[0].overview_polyline.points;

//     return res.json({
//       optimizedOrder,
//       polyline: routeOverview,
//       totalDistance: data.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
//       totalDuration: data.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server Error' });
//   }
// };


const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjhiMzgwOTEwOGY1ZDQ4N2NiMWQ1Y2E3NDMwZDFkMWNhIiwiaCI6Im11cm11cjY0In0=';

const ORS_OPTIMIZATION_URL = "https://api.openrouteservice.org/optimization";
const ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/reverse";


// controllers/busRouteController.js
// import axios from "axios";

// const ORS_OPTIMIZATION_URL = "https://api.openrouteservice.org/optimization";
// const ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/reverse";
// const ORS_API_KEY = "YOUR_FREE_ORS_KEY"; // Get from https://openrouteservice.org/sign-up/




exports.optimizeBusRoute = async (req, res) => {
    try {
        // Driver starting point
        const driverStart = {
            lat: 26.9124,
            lng: 75.7873,
            name: "Marriot, Jaipur, RJ, India"
        };

        // Passengers list (Jaipur)
        const passengers = [
            { id: 1, name: "Amit Sharma", pickup: { lat: 26.917605, lng: 75.816796 }, drop: { lat: 26.88099, lng: 75.792378 } },
            { id: 2, name: "Priya Singh", pickup: { lat: 26.8996993, lng: 75.8123739 }, drop: { lat: 26.81953, lng: 75.79716 } },
            { id: 3, name: "Rajesh Meena", pickup: { lat: 26.879802, lng: 75.780753 }, drop: { lat: 26.81953, lng: 75.79716 } },
            { id: 4, name: "Neha Verma", pickup: { lat: 26.81953, lng: 75.79716 }, drop: { lat: 26.806683, lng: 75.810730 } },
            { id: 5, name: "Vikas Gupta", pickup: { lat: 26.879802, lng: 75.780753 }, drop: { lat: 26.8505899, lng: 75.7909157 } }
        ];

        // Build shipments for ORS (pickup + delivery)
        const shipments = passengers.map((p, index) => ({
            id: p.id,
            name: p.name,
            pickup: {
                id: p.id * 10 + 1,
                location: [p.pickup.lng, p.pickup.lat],
                service: 300,
                amount: [1], // one passenger pickup
                description: `Pickup ${p.name}`
            },
            delivery: {
                id: p.id * 10 + 2,
                location: [p.drop.lng, p.drop.lat],
                service: 300,
                amount: [-1], // one passenger drop
                description: `Drop ${p.name}`
            }
        }));

        // Vehicle definition
        const vehicles = [
            {
                id: 1,
                profile: "driving-car",
                start: [driverStart.lng, driverStart.lat],
                end: [driverStart.lng, driverStart.lat],
                capacity: [30], // vehicle capacity
                time_window: [0, 43200] // operating time window in seconds
            }
        ];

        // Prepare ORS optimization body
        const body = {
            vehicles,
            shipments
        };

        // Send request to ORS Optimization API
        const { data } = await axios.post(ORS_OPTIMIZATION_URL, body, {
            headers: {
                Authorization: ORS_API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!data.routes || !data.routes.length) {
            return res.status(400).json({ error: "Failed to optimize route" });
        }

        const routeSteps = data.routes[0].steps;

        // Build quick lookup for jobId → name & action
        const jobLookup = {};
        shipments.forEach(s => {
            jobLookup[s.pickup.id] = s.pickup;
            jobLookup[s.delivery.id] = s.delivery;
        });

        // Reverse geocode each step
        const detailedSteps = await Promise.all(
            routeSteps.map(async step => {
                let locationName = "Unknown Location";
                if (step.location) {
                    try {
                        const geoRes = await axios.get(ORS_GEOCODE_URL, {
                            params: {
                                api_key: ORS_API_KEY,
                                ["point.lon"]: step.location[0],
                                ["point.lat"]: step.location[1],
                                size: 1
                            }
                        });
                        if (geoRes.data?.features?.length) {
                            locationName = geoRes.data.features[0].properties.label;
                        }
                    } catch (err) {
                        console.error("Geocode Error:", err.message);
                    }
                }
                return {
                    stepType: step.type || "drive",
                    jobId: step.job || null,
                    passengerName: jobLookup[step.job]?.description?.replace(/^(Pickup|Drop) /, "") || null,
                    action: jobLookup[step.job]?.description || "Drive",
                    location: {
                        coordinates: step.location,
                        name: locationName
                    }
                };
            })
        );

        // Final response

        // res.json(data);
        res.json({
            driverStart: {
                coordinates: [driverStart.lng, driverStart.lat],
                name: driverStart.name
            },
            totalDistance_km: (data.routes[0].distance / 1000).toFixed(2),
            totalDuration_min: (data.routes[0].duration / 60).toFixed(2),
            route: detailedSteps
        });

    } catch (error) {
        console.error("ORS Route Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Server Error" });
    }
};








