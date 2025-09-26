const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    bookingType: {
        type: String,
        enum: ["Rental", "Hostel", "Cafe", "Guide"], // types of bookings
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",   // <-- Name of your Location model
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",   // the user who made the booking
        required: true
    },

    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",   // the service provider / partner
        required: true
    },

    price: { type: Number, required: true },        // base price
    discount: { type: Number, default: 0 },         // discount amount
    coupon_code: { type: String },                  // applied coupon
    total_amount: { type: Number, required: true }, // final amount after discount
    details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
