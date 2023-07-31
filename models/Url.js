// const mongoose = require('mongoose');

// const urlSchema = new mongoose.Schema(
//     {
//     shortURL: String,
//   longURL: String,
//     clickCount: {
//       type: Number, default: 0
//     },
//   _id: {
//     type: Date,
//     default: Date.now,
//     },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const Url = mongoose.model('Url', urlSchema);

// module.exports = Url;



const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  longURL: { type: String, required: true },
  shortURL: { type: String, required: true },
  clickCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;


