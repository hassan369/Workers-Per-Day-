const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Ad = require('../models/ad');
const User = require('../models/user');

const uploadPath = path.join('public', Ad.coverImageBasePath);
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

router.get('/', async (req, res) => {
  let query = Ad.find();
  if (req.query.task != null && req.query.task != '') {
    query = query.regex('task', new RegExp(req.query.task, 'i'));
  }
  if (req.query.location != null && req.query.location != '') {
    query = query.regex('location', new RegExp(req.query.location, 'i'));
  }
  try {
    const ads = await query.populate('owner').exec();
    res.render('ads/index', {
      ads: ads,
      searchOptions: req.query,
    });
  } catch {
    res.redirect('/');
  }
});

router.get('/new', checkAuthemticated, (req, res) => {
  renderNewPage(res, new Ad());
});

router.post(
  '/',
  checkAuthemticated,
  upload.single('image'),
  async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    const ad = new Ad({
      task: req.body.task,
      location: req.body.location,
      phoneNumber: req.body.phoneNumber,
      coverImageName: fileName,
      description: req.body.description,
      owner: req.user.id,
    });
    try {
      const newAd = await ad.save();
      res.redirect(`ad/${newAd.id}`);
    } catch (err) {
      console.log(err);
      if (ad.coverImageName != null) {
        removeAdCover(ad.coverImageName);
      }
      renderNewPage(res, ad, true);
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('owner').exec();
    res.render('ads/show', { ad: ad });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    renderEditPage(res, ad);
  } catch {
    res.redirect('/');
  }
});

router.put(
  '/:id',
  checkAuthemticated,
  upload.single('image'),
  async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    let ad;

    try {
      ad = await Ad.findById(req.params.id);
      ad.task = req.body.task;
      ad.location = req.body.location;
      ad.phoneNumber = req.body.phoneNumber;
      ad.description = req.body.description;
      ad.owner = req.user.id;
      const tempImageName = ad.coverImageName;
      if (fileName != null) {
        ad.coverImageName = fileName;
      }
      await ad.save();
      removeAdCover(tempImageName);
      res.redirect(`/ad/${ad.id}`);
    } catch (error) {
      console.log(error);
      removeAdCover(fileName);
      if (ad != null) {
        renderEditPage(res, ad, true);
      } else {
        redirect('/');
      }
    }
  }
);

//delete book form
router.delete('/:id', async (req, res) => {
  let ad;
  try {
    ad = await Ad.findById(req.params.id);
    const tempImageName = ad.coverImageName; //to mack removeBookCover after await .remove(), because .remove() might not work so dont want delete img befor it
    await ad.remove();
    removeAdCover(tempImageName);
    res.redirect('/ad');
  } catch (err) {
    console.log(err);
    //can say book != null and first or book == null at first, all depent in order of await failer
    if (ad != null) {
      res.render('/ads/show', {
        ad: ad,
        errorMessage: 'could not remove book',
      });
    } else {
      res.redirect('/');
    }
  }
});

//for apply button
router.post('/apply/:id', checkAuthemticated, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    const user = await User.findById(req.user.id);
    const application = { user: user.id };
    ad.applications.push(application); //need to push object inside of it properitys for second schema
    await ad.save();
    res.redirect(`/ad/${ad.id}`);
  } catch (err) {
    console.log(err);
    res.redirect(`/ad/${ad.id}`);
  }
});

//show applications page
router.get('/applications/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('applications.user')
      .exec();
    const array = ad.applications;
    console.log('array is' + array);
    const uniqUsers = Array.from(
      array.reduce((a, c) => a.set(c.user.id, c), new Map()).values()
    );
    console.log('uniqe users are ' + uniqUsers);
    res.render('ads/applications', { uniqUsers: uniqUsers });
    console.log(ad);
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

//functions

function removeAdCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err); //just console the error no need to show it for to user, cause it's developer error
  });
}

async function renderNewPage(res, ad, hasError = false) {
  renderFormPage(res, ad, 'new', hasError);
}

async function renderEditPage(res, ad, hasError = false) {
  renderFormPage(res, ad, 'edit', hasError);
}
async function renderFormPage(res, ad, form, hasError = false) {
  try {
    //const user = await User.find({});
    const params = {
      //users: users,
      ad: ad,
    };
    if (hasError) {
      if (form === 'edit') {
        params.errorMessage = 'Error Updating Ad';
      } else {
        params.errorMessage = 'Error Creating Ad';
      }
    }
    res.render(`ads/${form}`, params);
  } catch {
    res.redirect('/ads');
  }
}

function checkAuthemticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/user/login');
}
module.exports = router;
