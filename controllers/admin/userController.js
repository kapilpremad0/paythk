const { render } = require('ejs');
const User = require('../../models/User');

exports.getUserList = async (req, res) => {
  try {
    res.render('admin/users/list',{ title: "Passenger" });
    // res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err });
  }
};

exports.getuserData = async (req, res) => {
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
      name: `<div class="d-flex align-items-center">
                            <div class="avatar rounded">
                                <div class="avatar-content">
                                    <img src="${item.profile_url}" width="50"
                                        height="50" alt="Toolbar svg" />
                                </div>
                            </div>
                            <div>
                                <div class="fw-bolder">${item.name}</div>
                                <div class="font-small-2 text-muted">${item.email}</div>
                                <div class="font-small-2 text-muted">${item.mobile}</div>
                                
                            </div>
                        </div>`,

      // status: item.status === 1
      //   ? `<span class="badge rounded-pill badge-light-primary me-1">Active</span>`
      //   : `<span class="badge rounded-pill badge-light-danger me-1">Inactive</span>`,
      // description: item.description,
      datetime: new Date(item.createdAt).toLocaleString(), // Format datetime
      action: `<div class="dropdown">
                          <button type="button" class="btn btn-sm dropdown-toggle hide-arrow py-0" data-bs-toggle="dropdown">
                            <i data-feather="more-vertical"></i>
                          </button>
                          <div class="dropdown-menu dropdown-menu-end">
                            <a class="dropdown-item" href="/admin/users/${item._id}">
                              <i data-feather="eye" class="me-50"></i>
                              <span>Show</span>
                            </a>
                            <a class="dropdown-item delete-user" href="#" data-id="${item._id}" data-name="${item.name}" >
                              <i data-feather="trash" class="me-50"></i>
                              <span>Delete</span>
                            </a>
                          </div>
                </div>`
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
