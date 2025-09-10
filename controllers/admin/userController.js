const { render } = require('ejs');
const User = require('../../models/User');

exports.getList = async (req, res) => {
  try {
    res.render('admin/users/list', { title: "Passenger" });
    // res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).send("User not found");

    // bookings empty for now (later you can fetch from Booking model)
    const bookings = [];

    res.render('admin/users/show', { title: "User Detail" , user,
      bookings,});
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
}

exports.deleteRecord = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err });
  }
};

exports.getData = async (req, res) => {
  try {

    const draw = parseInt(req.body.draw) || 0;
    const start = parseInt(req.body.start) || 0;
    const length = parseInt(req.body.length) || 10;
    const search = req.body.search?.value || "";
    const status = req.body.status; // Get the status filter

    const query = { user_type: "customer", otp_verify: true };

    // Search condition
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { mobile: new RegExp(search, "i") },
        { gender: new RegExp(search, "i") }
      ];
    }


    if (status) {
      query.status = status; // Add the status filter to the query
    }

    const totalRecords = await User.countDocuments();
    const filteredRecords = await User.countDocuments(query);



    const data_fetch = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(start)
      .limit(length)
      .exec();

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

    const data = data_fetch.map(item => ({
      name__: item.name,
      gender: item.gender,
      dob: item.dob,
      name: item.name_div,

      // status: item.status === 1
      //   ? `<span class="badge rounded-pill badge-light-primary me-1">Active</span>`
      //   : `<span class="badge rounded-pill badge-light-danger me-1">Inactive</span>`,
      // description: item.description,
      datetime: new Date(item.createdAt).toLocaleString(), // Format datetime
      action: item.action_div
    }));

    res.json({
      draw,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
