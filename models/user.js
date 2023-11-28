// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActivated: { type: Boolean, default: false },
  activationToken: { type: String, default: null },
  activationExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

});

const User = mongoose.model('User', userSchema);

module.exports = User;
