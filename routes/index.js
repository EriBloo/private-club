const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const User = require('../models/user');

const { checkAuthentication, checkRank } = require('../modules/helpers');
const {
  getIndex,
  postComment,
  getSignUp,
  postSignUp,
  getLogIn,
  postLogIn,
  getLogOut,
  getMember,
  postMember,
  postDelete,
} = require('../modules/controllers');

router.get('/', getIndex);

router.post(
  '/',
  checkAuthentication,
  body('comment')
    .trim()
    .escape()
    .isLength({ min: 5 })
    .withMessage('Message must be at least of 5 characters'),
  postComment,
);

router.get('/sign-up', getSignUp);

router.post(
  '/sign-up',
  body('name')
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage('Username must be at least of length 3')
    .isAlphanumeric()
    .withMessage('Username contains non alphanumeric characters')
    .custom(async (value) => {
      const result = await User.findOne({ name: value });
      if (result) {
        return Promise.reject();
      }
    })
    .withMessage('Name already taken'),
  body('password')
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage('Password must be at least of length 3')
    .custom((value, { req }) => value === req.body.confirm)
    .withMessage('Password confirmation must be the same as password field'),
  postSignUp,
);

router.get('/log-in', getLogIn);

router.post(
  '/log-in',
  body('name').escape(),
  body('password').escape(),
  postLogIn,
);
router.get('/log-out', getLogOut);

router.get('/member', checkAuthentication, getMember);

router.post(
  '/member',
  body('passcode')
    .escape()
    .custom((value) => {
      if (value === process.env.ADMIN_PASSCODE || value === process.env.MEMBER_PASSCODE) {
        return true;
      }
      return false;
    }),
  postMember,
);

router.post('/delete/:id', checkAuthentication, checkRank(2), postDelete);

module.exports = router;
