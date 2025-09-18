const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const expressLayouts = require('express-ejs-layouts');
const { initSocket } = require('./config/socket'); // socket setup
const http = require("http");
const multer = require("multer"); // 👈 For form-data (file uploads)

const verifyToken = require('./middlewares/auth');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false, // true if https
    },
  })
);

// Multer storage setup (form-data)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // save files inside /uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// 👇 Attach to req for usage in routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// App locals
app.locals.appName = process.env.APP_NAME;

// Views
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enable layouts
app.use(expressLayouts);
app.set('layout', 'admin/layouts/app');

// Static folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Current route middleware
app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  next();
});

// Routes
app.use('/admin', require('./routes/admin/index.js'));
app.use('/api', require('./routes/api/index.js'));


// app.use('/api/auth', require('./routes/auth'));
// app.use('/api', require('./routes/api.js'));
// app.use('/api/profile', verifyToken, require('./routes/profile'));
// app.use('/api/chat', require('./routes/chat'));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.success = null;
  res.locals.error = null;
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

// Create server
const server = http.createServer(app);

// Initialize socket.io
initSocket(server);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running with Socket.io + form-data support on port ${PORT}`)
);
