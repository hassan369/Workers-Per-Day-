const mongoose = require('mongoose');
const path = require('path');
const coverImageBasePath = 'uploads/userCovers';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    dropDups: true,
  },
  password: {
    type: String,
    required: true,
  },
  job: {
    type: String,
  },
  yearsOfExperience: {
    type: Number,
  },
  educationDegree: {
    type: String,
  },
  nationality: {
    type: String,
  },
  placeOfResidence: {
    type: String,
  },
  phoneNumber: {
    type: Number,
  },
  coverImageName: {
    type: String,
    required: true,
  },
});

userSchema.virtual('coverImagePath').get(function () {
  if (this.coverImageName != null) {
    return path.join('/', coverImageBasePath, this.coverImageName);
  }
});

module.exports = mongoose.model('User', userSchema);
module.exports.coverImageBasePath = coverImageBasePath; // the .CIBP is not fom exoport as defult
