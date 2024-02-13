const express = require('express');

const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getallReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.addreview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    // authController.protect,
    // authController.restrictTo('admin'),
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  );
module.exports = router;
