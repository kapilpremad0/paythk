const Itinerary = require('../../models/Itinerary');
const User = require('../../models/User'); // assuming you have a User model

exports.getList = async (req, res) => {
  try {
    res.render('admin/itineraries/list', { title: "Itineraries" });
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

    // 🔍 Search in destination, notes, or status
    if (search) {
      query.$or = [
        { destination: new RegExp(search, "i") },
        { notes: new RegExp(search, "i") },
        { status: new RegExp(search, "i") }
      ];
    }

    if (userId) {
      query.userId = userId;
    }

    const totalRecords = await Itinerary.countDocuments();
    const filteredRecords = await Itinerary.countDocuments(query);

    const data_fetch = await Itinerary.find(query)
      .populate("userId", "name email mobile") // get user details
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .exec();

    const data = data_fetch.map((itinerary, index) => ({
      serial: start + index + 1,
      user: itinerary.userId ? itinerary.userId.name : "N/A",
      destination: itinerary.destination,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      notes: itinerary.notes || "",
      status: itinerary.status,
      createdAt: itinerary.createdAt
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });
  } catch (err) {
    console.error("Itinerary getData Error:", err);
    res.status(500).json({ error: err.message });
  }
};
