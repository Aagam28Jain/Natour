const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true, //front or back mai extra space hata kr store krega
    maxlength: [40, 'An name not longer than 40 letters'],
    minlength: [3, 'An name  longer than 3 letters is required'],
    //  validate: [validator.isAlpha, 'Tour name only contain alphabets'],
  },
  email: {
    type: String,
    required: [true, 'please write email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: { type: String },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    require: [true, 'please provise a password'],
    minlength: [8, 'An name  longer than 3 letters is required'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, 'please provide a confirm password'],
    validate: {
      // it will works on save and create  not update
      validator: function (el) {
        return el === this.password;
      },
      message: 'password not matching',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
userSchema.pre('save', async function (next) {
  // only run if password is modified or new user is created
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // agar hmne password change nhi kiya ya abhi document nya bna to hm password changedAT property define nhi krenge
  //vrna uski value current time dalenge
  if (!this.isModified('password') || this.isNew) return next();
  // yha pr 1000 isiliye kiya kyuki hmara token create jldi ho jata pr DB mai store hone mai tym lgta hai
  // hmne maan liya ek sec lgegea to 1000 milisec hata diya
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// isko hm ek instance bolte hai isko hm khi pr bhi User k instance  pr use kr skte no need for  import
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  // false means NOT changed
  return false;
  // agar password change hoga to hi ye property set hogi
  //agar property nhi hai iska mtlb password kbhi change hi nhi hua
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  console.log('upar wala hmne forgot time create kiya hai ');
  // hm chahte 10 min mai ye token use ho vrna expire ho jaye
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
