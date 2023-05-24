const mongoose = require("mongoose");
//const { Schema } = mongoose.model;
const UserSchema = mongoose.Schema({
    facebook: {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
  },
});
const User_f = mongoose.model("User_f", UserSchema);
module.exports = User_f;