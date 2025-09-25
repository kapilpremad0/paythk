const axios = require("axios");

async function sendOtp(mobile, otp) {
    try {
        // Construct OTP message
        const message = `Hi, Your Login OTP is ${otp}. From DC JEWELRY.`;

        // API Config
        const apiKey = "8ZUltDNygPkuLXHr"; // Replace with your API key
        const senderId = "DCJWLR"; // Replace with your Sender ID
        const apiUrl = "http://13.235.193.85/V2/http-api.php";

        // Handle multiple numbers
        const mobileNumbers = Array.isArray(mobile) ? mobile.join(",") : mobile;

        // Make GET request
        const response = await axios.get(apiUrl, {
            params: {
                apikey: apiKey,
                senderid: senderId,
                number: mobileNumbers,
                message: message,
                format: "json"
            },
            httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }) // disable SSL verification
        });

        return response.data;
    } catch (error) {
        console.error("Send OTP Error:", error.message);
        throw error;
    }
}

module.exports = sendOtp;
