const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');

const app = express();
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
/*it is called middleware it stands between req and res. it transforms incoming req
  and data is added to this req */
app.use(express.json({ limit: '10kb' }));
app.set('view engine', 'pug');
// ho skta hai path mai user ne slash diya ho ya nhi
// agar hm path dalte to exact match hoa pdta isme porra match nhi krna hoga
// slash ignore kiya ja skta hai
app.set('views', path.join(__dirname, 'views'));
/*serving static files 
agar hme public folder k andar jo overview.html hai usko browser pr 
agar jaakr likhu 127.0.0.1:3000/public/overview.html 
to ye run nhi hogi kyuki hmne esa koi route define nhi kiya hai 
to isko run krne k liye likho*/
app.use(express.static(path.join(__dirname, 'public')));
// put helmet package always at the start of middleware stack
// it set security HTTP headers
app.use(helmet());

//DATA sanitization against NOSQL QUERY injection
app.use(mongoSanitize()); // "email":{"$gt":""} and any correct password will open this and this query always returns true

//DATA sanitization
app.use(xss());

//parameter pollution control
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupsize',
      'difficulty',
      'price',
    ],
  }),
); // duplicate parameter remove krta
// ex agar hmne query mai 2 baar sorting likh di to error aa skta
// last param k hisab se sorting hogi shayad

//3rd party middleware

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
/*creating ou r own middle ware  app.use(fn)
app.use k ander hm middle ware fn create krte or app.use use middleware stack mai puch kr deta hai*/
/*next is the fn for next fn in middle ware stack it is always argument  no 3 weather you call it next or x*/
//
//app.use((req, res, next) => {
//   //console.log('helo this ia middleware')
//   //dont forget to call next fn else req res cycle will get stuck
//   req.requestTime = new Date().toISOString();
//   next();
// });
//in middleware order of code is important also routes are also a type of middleware
//so if there are 2 routes and you write our middleware in between the code of the 2 then middleware only runs in 2 as 1st req res cycle is finished.

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP,please tru again after an hour',
});
app.use('/api', limiter);

//isse apan ne ye bol diya ki agar koi route na mile to ek baar idhar public folder mai aakr check krlo
//to ab agar file run krni hai to likho   127.0.0.1:3000/overview.html
//  /public nhi likha kyuki roue nhi hoga esa koi to vo apne aap public mai aa jayega
// isme kyuki hmne upar bta rkha hai ki views kha pr hai to ye views foldermai base naam ki
// file dhund kr render krega
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//hm yha pr ek route handler rkh rhe
//hmara target ye hai ki agar koi galat route daal de to usko handle krna
// to hm sbse end mai yha pr handler rkh denge ye tbhi run hoga jb upar k saare routes check ho chuke honge
// ye ek middle ware hi hai
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `cant find ${req.originalUrl} on this server`,
  // });

  // const err = new Error(`cant find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err); // by default esa mana jada ki next k andar jo bhi argument hai vo error hi hai
  //jo jese hi isme argument dekhega to middleware stack mai aage k middleware run nhi krega or
  //err global error handler ko bhej dega

  next(new AppError(`cant find ${req.originalUrl} on this server`, 404));
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;
