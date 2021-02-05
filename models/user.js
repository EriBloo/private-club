const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true, maxlength: 30 },
  password: { type: String, require: true },
  rank: { type: Number, enum: [0, 1, 2] },
});

module.exports = mongoose.model('User', UserSchema);
