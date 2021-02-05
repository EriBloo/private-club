const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxlength: 300 },
});

module.epxorts = mongoose.model("Comment", CommentSchema);