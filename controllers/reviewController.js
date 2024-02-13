const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

const catchAsync = require('../utils/catchAsync');

// isme hmne dono kaam krdiye jese agar
//kisi ne dala /:tourId/reviews    ?? /reviews
// to hoga ye kisi second req mai tourId nhi hogi to apne aap filter={}
//hoga to saare reviews aayenge or first URL mai tour Id k hisab se selection hoga

exports.getallReviews = factory.getAll(Review);

//exports.getReview = factory.getOne(Review, { path: 'reviews' });
exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.getReview = factory.getOne(Review);
exports.addreview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
