const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const Ad = require('../models/ad');
const bcrypt = require('bcrypt');
const passport = require('passport');
const uploadPath = path.join('public', User.coverImageBasePath); //set it under Book
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

//upload became multer
const upload = multer({
  dest: uploadPath, //where to save uploaded
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  }, //fileFilter define which file server except, null means no errors
});

const initializePassport = require('./passport-config');
initializePassport(
  passport
  //async (id) => User.findById(id)
); //so can use passport object inside function
//her we use initializePassport function and as usual we give the function variables to work good
//first parameter is opject so can use it's methods in function
//second is function declaration so it can use it with what ever parameters it want

router.get('/', checkAuthemticated, (req, res) => {
  res.render('users/index', { name: req.user.name });
});

router.get('/login', checNotkAuthemticated, (req, res) => {
  res.render('users/login');
});

router.post(
  '/login',
  checNotkAuthemticated,
  passport.authenticate('local', {
    successRedirect: '/user/show',
    failureRedirect: 'login',
    failureFlash: true,
  })
);

router.get('/register', checNotkAuthemticated, async (req, res) => {
  res.render('users/register');
});

router.post(
  '/register',
  checNotkAuthemticated,
  upload.single('image'),
  async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null;

    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        job: req.body.job,
        yearsOfExperience: req.body.yearsOfExperience,
        educationDegree: req.body.educationDegree,
        nationality: req.body.nationality,
        placeOfResidence: req.body.placeOfResidence,
        phoneNumber: req.body.phoneNumber,
        coverImageName: fileName,
      });
      const newUser = await user.save();
      res.redirect('login');
    } catch (error) {
      console.log(error);
      if (user.coverImageName != null) {
        removeUserCover(user.coverImageName);
      }
      res.redirect('register');
    }
  }
);

router.get('/show', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const ads = await Ad.find({ owner: req.user.id }).populate('owner').exec();
    res.render('users/showLoged', {
      user: user,
      adsByUser: ads,
    });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

//show one user page
router.get('/show/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const ads = await Ad.find({ owner: user.id }).populate('owner').exec();
    res.render('users/show', {
      user: user,
      adsByUser: ads,
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.delete('/logout', (req, res) => {
  req.logOut((err) => err && doThis(next(err)));

  res.redirect('/user/login');
});

function checkAuthemticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/user/login');
}

function checNotkAuthemticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/user/show');
  }
  next();
}

function removeUserCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), (err) => {
    if (err) console.error(err); //just console the error no need to show it for to user, cause it's developer error
  });
}

module.exports = router;
