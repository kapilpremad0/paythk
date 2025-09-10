const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const expressLayouts = require('express-ejs-layouts');
const { initSocket } = require('./config/socket');
const http = require("http");



const verifyToken = require('./middlewares/auth'); // 👈 Import middleware

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
const path = require('path');



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

app.locals.appName = process.env.APP_NAME;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// enable layouts
app.use(expressLayouts);
app.set('layout', 'admin/layouts/app'); // default layout (without .ejs extension)


app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentRoute = req.path; // stores the current URL path
  next();
});


// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/assets', express.static(path.join(__dirname, 'assets')));



app.use('/admin', require('./routes/admin/index.js'));


app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api.js'));
app.use('/api/profile', verifyToken, require('./routes/profile'));
app.use('/api/chat', require('./routes/chat'));


const server = http.createServer(app);
initSocket(server);

app.use((req, res, next) => {
  res.locals.success = null;
  res.locals.error = null;
  next();
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
