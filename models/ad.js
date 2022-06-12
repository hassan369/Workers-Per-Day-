const mongoose = require('mongoose');
const path = require('path');
const coverImageBasePath = 'uploads/adCovers';

const applicationsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

//adschema
const adSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: { type: String, required: true },
    coverImageName: {
      //save just name(small string), and save image in server (file system), store files in fs when you can
      type: String,
      required: true,
    },
    location: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId, //. and . and . is logicly, just for not rewrite schema
      required: true,
      ref: 'User',
    },
    applications: [applicationsSchema], //push obj with property user to it
  },
  { timestamps: true }
);

adSchema.virtual('coverImagePath').get(function () {
  if (this.coverImageName != null) {
    return path.join('/', coverImageBasePath, this.coverImageName);
  }
});

module.exports = mongoose.model('Ad', adSchema);
module.exports.coverImageBasePath = coverImageBasePath; // the .CIBP is not fom exoport as defult
