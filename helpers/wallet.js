const Wallet = require('../models/Wallet.js');
const User = require('../models/User');

exports.logWalletTransaction = async ({ userId, amount, type, reason, description = '' }) => {

  const lastTx = await Wallet.findOne({ userId }).sort({ createdAt: -1 });
  let lastBalance = lastTx ? lastTx.balance_after : 0;

  const newBalance =
    type === "credit" ? lastBalance + amount : lastBalance - amount;

  const walletTx = await Wallet.create({
    userId,
    amount,
    type,
    reason,
    description,
    balance_after: newBalance,
  });
  
  await User.findByIdAndUpdate(userId, { wallet_balance: newBalance });

  return walletTx;

  await transaction.save();
};
