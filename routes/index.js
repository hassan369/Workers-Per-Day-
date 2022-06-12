const express = require('express');
const router = express.Router();
const Ad = require('../models/ad');

router.get('/', async (req, res) => {
  let ads;
  try {
    ads = await Ad.find()
      .sort({ createdAt: 'desc' })
      .populate('owner')
      .limit(10)
      .exec();
  } catch {
    ads = [];
  }
  res.render('index', { ads: ads });
});

module.exports = router;
