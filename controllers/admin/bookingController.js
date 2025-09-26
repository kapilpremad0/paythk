const Booking = require('../../models/Booking');
const User = require('../../models/User'); // assuming you have a User model

exports.getList = async (req, res) => {
  try {
    res.render('admin/bookings/list', { title: "bookings" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email mobile")        // populate user details
      .populate("partner", "name email mobile")     // populate partner details
      .lean();

    if (!booking) return res.status(404).send("Booking not found");

    res.render("admin/bookings/show", { booking });
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
    const userId = req.body.userId || "";

    const query = {};

    // 🔍 Search fields: status, price, user name
    if (search) {
      query.$or = [
        { status: new RegExp(search, "i") },
        { price: new RegExp(search, "i") },
        { total_amount: new RegExp(search, "i") }
      ];
    }

    if (userId) {
      query.user = userId; // match field in schema
    }

    const totalRecords = await Booking.countDocuments();
    const filteredRecords = await Booking.countDocuments(query);

    const data_fetch = await Booking.find(query)
      .populate("user", "name email mobile") // ✅ correct field
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .exec();

    const data = data_fetch.map((booking, index) => ({
      serial: start + index + 1,
      user: booking.user ? booking.user.name : "N/A",
      vehicle: booking.details?.vehicle
        ? `${booking.details.vehicle.bikeName} (₹${booking.details.vehicle.price})`
        : "N/A",
      bookingType: booking.bookingType,
      price: booking.price,
      discount: booking.discount || 0,
      total_amount: booking.total_amount,
      status: booking.status,
      createdAt: booking.createdAt,
      _id: booking._id
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });
  } catch (err) {
    console.error("Booking getData Error:", err);
    res.status(500).json({ error: err.message });
  }
};
