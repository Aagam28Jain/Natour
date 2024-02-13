const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //in delete we use status code 204 which means no return

    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(
          `no ${Model} found with the id ${req.params.id}  in DB`,
          404,
        ),
      );
    }
    // you can also write
    // TOur.findOne({_id:req.params.id})
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(
        new AppError(`no tour found with the id ${req.params.id}  in DB`, 404),
      );
    }
    // you can also write
    // TOur.findOne({_id:req.params.id})
    res.json({
      status: 'success',
      data: {
        doc /*vese key value pair hota pr keyname =valuename to sirf ek baar naam likh do to bhi chalega  */,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //to get any tour info by just id we use colon to show this is a variable
    //req.params gives key value pair of all the variables that are present int the url
    //like /api/:id/:x/:y? ab hoga ye jo question mark wala param hai v optional hai or baaki saare compulsary agar inke bina likha to error aayega
    //{ id: '5', x:'23' } like this
    // console.log(req.params);

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate('reviews');
    const doc = await query;
    // you can also write
    // TOur.findOne({_id:req.params.id})
    if (!doc) {
      return next(
        new AppError(`no tour found with the id ${req.params.id}  in DB`, 404),
      );
    }
    res.json({
      status: 'success',
      data: {
        doc /*vese key value pair hota pr keyname =valuename to sirf ek baar naam likh do to bhi chalega  */,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // ye niche wali 2 line sirf get all reviews mai kaam ane wali hai ese to.
    // ye ek hack hai kyuki baaki kisi mai bhi tour ki id param mai bheji nhi jayegi to filter null hi rhega sirf
    // get all reviews mai hi hum /tours/:id/reviews mai bheji id
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //if we dont write anything in find it will return all the document

    //we can filter thing using 2 methods
    //1st is using filter object
    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // });

    // 2nd is using mongoose special fn.
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // agar mujhe ispe sort krna or mene vo url kr likha to ye query mai smjhega hi nhi kyuki ye  schema mai nhi hai
    //to hmko filter object se ye saare filter alag krke sirf vhi filter rkhne honge jo ki schema mai ho

    //FILTERING
    // const queryObj = { ...req.query };

    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((el) => delete queryObj[el]);
    // //kyuki hmko find method mai await lga hua hai to hm filtering saath nhi kr skte ye sirf find ka hi result dega to usko alag se kr rhe hai or sirf last operation mai await krenge
    // //ADVANCE FILTERING
    // //2)Advanced filtering
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // // req .query return the same filter object that we write in url
    // let query = Tour.find(JSON.parse(queryStr));

    //SORTING
    // if (req.query.sort) {
    //   //agar aap 2 param k basis pr sort krna chahte ho to
    //   //hmne url mai 2 param ese likhe hai ?sort=price,ratingavg
    //   //hmare query .sort()  fn ko chahiye ki jitne bhi param ho saare ek space k baad ese passs kro
    //   //ex. price ratingsAverage
    //   //to hmko krna ye hai , hta kr spaace lana hai
    //   const sortBy = req.query.sort.split(',').join(' ');

    //   query = query.sort(sortBy);
    // } else {
    //   query = query.sort('-createdAt');
    // }

    //FIELD LIMITING
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v'); //- lgane se field exclude
    // }

    //query = query.select(fields);
    //PAGINATION

    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;

    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This page does not exist');
    // }
    //EXECUTE QUERY
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    res.json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc /*vese key value pair hota pr keyname =valuename to sirf ek baar naam likh do to bhi chalega  */,
      },
    });
  });
