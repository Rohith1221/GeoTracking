const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const issueSchema = new Schema( //defines the structure
  {
    uname: {
      type: String,
      required: true,
    },
    mail: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    latitude: {
      type: String,
    },
    longitude: {
      type: String,
    },
    issueID: {
      type: String,
    },
    img: {
      type: String,
    },
    Complaint_description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Issue = mongoose.model("Issue", issueSchema); //blog model
module.exports = Issue;
