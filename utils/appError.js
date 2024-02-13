class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    //ye nhi pata kya hai pr likhna jaruri hai
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;

//ye hmne  central error handler k liye bnaya hai
//khi pr bhi error aayega or hm next(err) krenge to ye sb call hoga
