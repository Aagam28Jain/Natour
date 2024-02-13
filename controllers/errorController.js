const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `INVALID ${err.path} :${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  console.log(value);
  const message = `Duplicate field value: ${value}.please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data   ${errors.join('. ')}`;
  return new AppError(message, 400);
};
//hmne yha pr ye do fn isi liye lihe hai kyuki hm chahte production k baad user ko error dikhenge to vvo itne technical nhi hone chahiye
// pr development time jo error hai usme max info aaye
const sendErrorProd = (err, res) => {
  //operational error mtlb input galat dAL DIYA,YA ROUTE GALAT LIKH DIYA
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    //programming or other unknown error
  } else {
    // 1)log the error
    console.error('ERROR 😍', err);
    //2) send a generic message
    res.status(err.statusCode).json({
      status: 'error',
      message: 'bhai nhi pata error kya hai ye operational error nhi hai ',
    });
  }
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
const handleJWTError = () =>
  new AppError('Invalid Token .please login again', 401);

const handleExpiredToken = () =>
  new AppError('Token has been expired please log in again quickly', 401);
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // iska mtlb agar status code pehle se defined hai to vo use kr vrna 500
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, name: err.name, errmsg: err.errmsg };
    // ye hm is liye kr kr rhe taaki agar galat input aaye to vo bhi operation mai jaaye
    //mongo DB related error is also operational error
    // cast error is name of error agar hm galat input id vgera daal de
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleExpiredToken();
    sendErrorProd(error, res);
  }
};

// it is the only  error middleware  handler kyuki iski argument mai hi err hai to jese hi error dekhega isko run krega
