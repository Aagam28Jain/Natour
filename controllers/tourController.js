const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
/*yha pr v1 vgera ka kaam ye hai ki agar api mai changes hue uske baad hme 
api  use krna to hm v2 daal denge to hoga ye jo v1 use kr rhe unli link bhi
 destroy nhi hogi or hm bhi run kr skenge*/
/*
  * tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
);
 */

// exports.checkBody = (req, res, next) => {
//   const { name, price } = req.body;

//   if (!name || !price) {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'misiing name or price',
//     });
//   }

//   next();
// };
//next k karan hmara middle ware apni stack k next middle ware pr ja pata hai agar ye nhi likha to atak jayega or error aa jayega
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getalltours = factory.getAll(Tour);
// app .get mai hm saare tours ka info bhejna chahte jo ki tours-simple.json mai hai

//req url kuch is type se hogi
// /tours-within/233/center/34.11745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  //console.log(distance, latlng, unit);
  const lat = latlng.split(',')[0];
  const lng = latlng.split(',')[1];
  // radius is distance in radians i.e. distance / radius of earth
  // first radius and miles if not assumed it is in km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('please provide lat,lng in the format a,b', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  // console.log(distance, latlng, unit);
  const lat = latlng.split(',')[0];
  const lng = latlng.split(',')[1];

  if (!lat || !lng) {
    next(new AppError('please provide lat,lng in the format a,b', 400));
  }
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    // geonear is always the first stage
    // indexing of one field is necessary
    // int this case we have already indexed startlocation in tour model

    {
      $geoNear: {
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',

    data: {
      data: distances,
    },
  });
});

exports.gettourbyid = factory.getOne(Tour, { path: 'reviews' });

// tour = tours.find((el) => el.id === id);
// res.json({
//   status: 'success',
//   data: {
//     tour,
//   },
// });

exports.addtour = factory.createOne(Tour);
//post mtlb data bhejna get mtlb data lena

//to update we can use patch /put
//put needs the whole updated object;  while patch needs only the updated properties of the object
exports.updatetour = factory.updateOne(Tour);

exports.deletetour = factory.deleteOne(Tour);

exports.getStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        // _id: null,
        numTours: { $sum: 1 },
        numRatingss: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {$match:{_id:{$ne:'easy'}}}
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStats: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    { $sort: { numTOurStarts: -1 } },
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});
