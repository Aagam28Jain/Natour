const crypto = require('crypto');
const { promisify } = require('util');
//const bcrypt = require('bcryptjs');
// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true, // iska mtlb cookie sirf encrypted connection pr hi bheji ja skti hai ex. HTTPS
    httpOnly: true, // iska mtlb cookie cannot be accessed or modified by broweser
  };
  // a cookie is basically just a small piece of text that a server send to the client
  // when client recieve .it stores the cookie  automatically and automatically send it back along with all future requests to the same server.
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // hm yha pr save nhi kr rhe ye hm bs ye chahte ki response mai password na dikhe
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  // yha ptr create({req.body}) mt likhna kyuki koi bhi admin ka role yha likh kr bn skta
  // hm sirf yha se us person k input le rhe agar kisi ko admin bnana hoga to hm DB on krkebna denge

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);
  // check if user has provided by email and password
  if (!email || !password) {
    return next(new AppError('please write email and password carefully', 400));
  }

  //check if user exists and password is correct
  // hme apne schema mai esa kr rkha hai ki koi bhi user data mangega req se to password nhi aayenge
  //unhe lane k liye taki hm fiels match kr ske hm yha alag se select krke password bula rhe
  const user = await User.findOne({ email }).select('+password');
  //hm ese correct mai nhi daal skte kyuki agar user nhi hai to user.password k karanerror aayega
  // const correct = await user.correctPassword(password, user.password);
  // we do not specify weather email is incorrect or password is incorrect vrna attacker ko pata chal jayega kya galat daal rha vo
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('INCORRECT EMAIL OR PASSWORD', 401));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check of its there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('you are not logged in! please log in to get access'),
      401,
    );
  }
  //2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user still exists
  //yha pr hm ye check kr rhe ki esa to nhi hai ki user ko token mil gya lekin kisi karan usne id delete krdi ho ya admin
  //ne delete kri ho to fir usko access dena hai
  //yha pr ye bhi check ho jayega agar payload change iska mtlb id change hui to decoded ki value galat aayegi to next line  mai error aa jayega .
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(new AppError('The User does not exist now', 401));
  }

  //4)ye ho skta hai ki mene token generate kiya mera token kisi paas chala gya
  // mene socha password change krdu taki vo access na kr paaye
  // to hm yhi implement krenge if password changed after token is issued then do not login
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!please log in again.', 401),
    );
  }
  req.user = freshUser;
  next();
});

// iske pehle upar wara run hoga kyuki delete route ye pehla middleware hai
// or iske end mai hmne re.user krke sb save kr rkha hai
//iske karan hme req. user mai sara info saved milega if user login is successfull
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('you do not have permisssion to access', 403));
    }
    next();
  };
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        `NO such user exists with this email address ${req.body.email}`,
        404,
      ),
    );
  }

  //2)Generate the reset token
  const resetToken = user.createPasswordResetToken();
  // ye validate wala kaam hm isiliye kr rhe kyuki hm sirf email chahiye name vgera nhi or vpo required hai schema mai

  await user.save({ validateBeforeSave: false });

  //3)send it to users email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\n
  If you didn't forget your password ,please ignore this email!`;

  console.log(resetToken);
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send via mail',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an Error sending the email,Try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get the user based on the token

  // ye step hm ese krenge hmne mail pr original token bheja hai or DB ,ai uska encrypted version store kiya
  // kyuki DB access ho skta to koi original na dekhe
  //hm krenge ye ki original ko encrypt krenge jisse DB mai match vo user hai

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    //upar wali line se check kiye ki token expiry date should be greater than current date jiska mtlb token expire nhi hua hai
  });

  //2)agar token expired nhi hua or token valid hai then  set new password
  if (!user) {
    return next(new AppError('token is invalid or has been expired', 400));
  }
  // password validators check krenge saari chize
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get the user from the collection

  const user = await User.findById(req.user.id).select('+password');

  //2) check if posted passowrd is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  console.log(user);
  //3) if you came till this point then update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  console.log(user);
  await user.save();

  //4) User.find by ID and Update will not work and THis will not work in such cases
  createSendToken(user, 200, res);
});
