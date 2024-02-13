const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

const userController = require('../controllers/userController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// iske niche jo bhi routes hai usme authentication jaruri hai to hm ya to sbme
// authController.protect middleware lga skte ya to fir yhi pr ek middleware bna do
// isse hoga ye ki iske aage k jitne bhi fn hai vo vese bhi isse hokr hi jayenge
router.use(authController.protect);
router.patch(
  '/updateMyPassword',

  authController.updatePassword,
);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.use(authController.restrictTo('admin'));
router.route('/').get(userController.getallUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
