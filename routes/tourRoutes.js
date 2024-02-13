const express = require('express');

const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');

//it is called a param middleware it only runs with params mentioned here only id.
// router.param('id', (req, res, next, val) => {
//   console.log(`this is my id = ${val}`);
//   next();
// });

// yhm ye niche wala isiliye nhi use kr rhe kyuki hme tour router mai review controller lana pdla jisse confusion bd skta

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.addreview,
//   );
// ye app.use jesa hi hai ab jo bhi iss prakar ka URL hoga vo sidhe reviewRouter se
// redirect hoga
router
  .route('/')
  .get(tourController.getalltours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.addtour,
  );
router
  .route('/:id')
  .get(tourController.gettourbyid)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updatetour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //sirf yhi roles access kr skte hai
    tourController.deletetour,
  );

router
  .route('/top-5-cheapest')
  .get(tourController.aliasTopTours, tourController.getalltours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistance);

//ye vo saare tours hai jisme tour or review dono ka use hai

router.use('/:tourId/reviews', reviewRouter);

router.route('/Tour-stats').get(tourController.getStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

module.exports = router;
