const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    reason: { type: String },
    description: { type: String, default: "" },
    balance_after: { type: Number, default: 0 }, // ✅ track balance
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);


