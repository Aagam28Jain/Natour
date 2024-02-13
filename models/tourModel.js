const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, //front or back mai extra space hata kr store krega
      maxlength: [40, 'An name not longer than 40 letters'],
      minlength: [3, 'An name  longer than 3 letters is required'],
      //  validate: [validator.isAlpha, 'Tour name only contain alphabets'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'bhai difficulty set krna jaruri hai'],
      //enum works only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty is easy medium hard only',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating is always greter than 1'],
      max: [5, 'rating is always less than 5'],
      set: (val) => Math.round(val * 10) / 10, // ye rounding integer mai krta hai 4.666 ko 5 krdega
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    Discount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only works with creating new document not with updating
          //this only points to current doc on new document creation
          return val < this.price;
        },
        message: 'Discount {{VALUE}} should be greater than regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'bhai samaj summary jaruri hai'], //removes all white spaces from front and back
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'bhai samaj images jaruri hai'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date], //different dats in which tour is starting say 10 dec, 13 jan
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// indexing ka code yha se hata diya to indexing nhi hategi
// uske liye compass mai jake indexing hatao
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//there virtual property does not work in query as you cannot write tour.find('durationWeeks =1)
//as these properties are not part of the database
//yha pr hm arrow fn use nhi kr skte kyuki hm this property ue kr rhe
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// hmne virtual populate isiliye use kiya kyuki agar refrencing vgera use krte to array bhot bada bnta

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE :runs before .save() and .create()
// save ka mtlb save k pehle ya baad run hoga
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// ye middleware isiliye hai taki jo embedding k liye user data chahiye vo sara hm iss step mai lakr save kr rhe hai

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//yha pr this avai nhi hai doc finished document ka copy hai
// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
//yha pr this current query ko pointkrega
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordResetExpires -passwordResetToken',
  });
  next();
});

//AGGREGATION QUERY
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
