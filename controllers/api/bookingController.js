const express = require('express');
const User = require('../../models/User');
const Rental = require('../../models/Rental');
const Booking = require('../../models/Booking');
const router = express.Router();
const formatError = (field, message) => ({ [field]: message });




exports.bookRental = async (req, res) => {
    try {
        const { vehicleId, discount = 0, coupon_code = null } = req.body;
        const userId = req.user.id;

        // Step 1: Find rental that contains the vehicle
        const rental = await Rental.findOne({ "vehicles._id": vehicleId });
        if (!rental) {
            return res.status(404).json({ message: "Rental with this vehicle not found" });
        }

        // Step 2: Get the matching vehicle subdocument
        const vehicle = rental.vehicles.id(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found in this rental" });
        }

        // Step 3: Calculate booking amounts
        const price = vehicle.price;
        const discountAmount = discount > 0 ? discount : 0;
        const total_amount = price - discountAmount;

        // Step 4: Create booking
        const booking = new Booking({
            bookingType: "Rental", // enum: ["Rental", "Hostel", "Cafe", "Guide"]
            user: userId,
            partner: rental.partner,
            location: rental.location,
            price,
            discount: discountAmount,
            coupon_code,
            total_amount,
            details: {
                rental: {
                    "rentalId": rental._id,
                    "address": rental.address,
                    "terms": rental.terms,
                    "description": rental.description,
                    "contactPerson": rental.contactPerson,
                    "contactNumber": rental.contactNumber,
                    "email": rental.email,
                    "website": rental.website,
                    "imageUrls": rental.imageUrls,
                }, // just save rental id (better than whole rental doc)
                vehicle: {
                    "vehicleId": vehicle._id,
                    "bikeName": vehicle.bikeName,
                    "price": vehicle.price,
                    "helmet": vehicle.helmet,
                    "person": vehicle.person,
                    "images": vehicle.images,
                    "maxSpeed": vehicle.maxSpeed,
                }
            }
        });

        await booking.save();
        // Step 5: Respond
        return res.json({
            message: "Booking created successfully",
            booking,
        });
    } catch (err) {
        console.error("book rental error:", err.message);
        return res.status(500).json({ message: "Server Error " + err.message });
    }
};
