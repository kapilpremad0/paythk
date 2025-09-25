// utils/notification.js
const admin = require("../config/firebase");



// sendNotification(fcmToken, {
//   title: "Pathyk Update 🚀",
//   body: "Your registration was successful!",
//   data: { type: "registration", userId: "12345" },
// });

/**
 * Send push notification to a device
 * @param {string} token - Device FCM token
 * @param {Object} payload - Notification payload
 */
async function sendNotification(token, payload) {
  try {
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {}, // optional key-value data
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Notification error:", error);
    throw error;
  }
}

module.exports = sendNotification;
