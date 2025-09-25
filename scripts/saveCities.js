// scripts/saveCities.js
require("dotenv").config();  // 👈 add this at the very top
const mongoose = require("mongoose");
const { State, City } = require("country-state-city");
const Location = require('../models/Location');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    const states = State.getStatesOfCountry("IN");

    for (let st of states) {
      const cities = City.getCitiesOfState("IN", st.isoCode);
      const docs = cities.map(c => ({
        state: st.name,
        stateCode: st.isoCode,
        city: c.name,
        country: "India",
      }));
      await Location.insertMany(docs);
      console.log(`✅ Saved cities of ${st.name}`);
    }

    console.log("🎉 All states and cities saved!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
  }
})();
