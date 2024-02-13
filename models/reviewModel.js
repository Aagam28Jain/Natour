const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'please provide a review'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      // required: [true, 'A tour must have a duration'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a User'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// this points to current document
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// pre nhi use krna kyuki current document abhi save nhi hua to calculation mai vo nhi aayega
//post does not have access to next
reviewSchema.post('save', function (next) {
  this.constructor.calcAverageRatings(this.tour);
});

// isme problem ye hai ye query middleware hai to iske paas this mai document storenhi hai blki query store hai
// hmara poora kaam post mai hai pr post  pr  query ka access bhi nhi hota  to hm pre se tour id vgera nikalte hai and post pr bhejkr apna kaam krte hai

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // ye hmne apna ek query variable bnaya hai
  // this .r se hme r ka access port middleware mai bhi mil gya
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
