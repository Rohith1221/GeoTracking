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
      unique: true,
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
    task_manger: {
      type: String,
      default: "",
    },
    task_manger_mail: {
      type: String,
      default: "",
    },
    taskmanger_mail_sent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Issue = mongoose.model("Issue", issueSchema); //issue model
module.exports = Issue;
