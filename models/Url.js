const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
 
  longURL: { type: String, required: true },
  shortURL: { type: String, required: true },
  copyCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Assuming ObjectId and a reference to the User model
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;




