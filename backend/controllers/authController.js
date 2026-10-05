const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

exports.signup = async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  return res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
};

exports.login = async (req, res) => {
  // 1. Check if email and pass exist
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // 2. Check if they are correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  // 3. OK? send a token to a client
  const token = signToken(user._id);

  return res.status(200).json({
    status: 'success',
    token,
  });
};

exports.protect = async (req, res, next) => {
  // 1. Getting Token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError(
      'You are not logged in. Please log in to get access.',
      401,
    );
  }

  // 2. Verification Token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Your token has expired. Please log in again.', 401);
    }

    throw new AppError('Invalid token. Please log in again.', 401);
  }

  // 3. Check if User exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new AppError(
      'The user belonging to this token no longer exists.',
      401,
    );
  }

  // 4. Check if User changed pass after JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'User recently changed password. Please log in again.',
      401,
    );
  }

  req.user = currentUser;
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You are not authorized for this action', 403);
    }

    next();
  };

exports.forgotPassword = async (req, res) => {
  // 1.Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new AppError('No user with provided email', 404);
  }

  // 2.Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //

  // 3. Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;

  console.log(message);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });
  } catch (err) {
    console.error('Email sending failed:', {
      message: err.message,
      code: err.code,
      command: err.command,
    });
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      'There was an error sending the email. Please try again later.',
      500,
    );
  }

  return res.status(200).json({
    status: 'success',
    message: 'Password reset token sent to email',
  });
};

exports.resetPassword = async (req, res) => {
  // 1. Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2. If the token is valid, the user exists, set a new pass
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Token is invalid or has expired', 400);
  }

  // 3. Update changePassAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = signToken(user._id);

  // 4. Log the user in and send JWT
  return res.status(200).json({
    status: 'success',
    token,
  });
};

exports.updatePassword = async (req, res) => {
  // 1. Get user from a collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if the posted pass is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    throw new AppError('Your current pass is wrong', 401);
  }

  // 3. If so, the update passes
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  const token = signToken(user._id);

  // 4. Log user in, send JWT
  return res.status(200).json({
    status: 'success',
    token,
  });
};
