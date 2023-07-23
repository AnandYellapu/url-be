const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create an inactive user account
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isActivated: false, // Set the isActivated property to false initially
    });

    // Generate an activation token
    const activationToken = crypto.randomBytes(20).toString('hex');
    user.activationToken = activationToken;
    user.activationExpires = Date.now() + 3600000; // Token expiration time (1 hour)

    // Save the user with the activation token and expiration
    await user.save();

    // Code for sending the activation email
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: "KITCHEN-RECIPE-MANAGEMENT - Account Activation",
      text: `Welcome to our application! Please click the following link to activate your account: ${process.env.APP_URL}/activate/${activationToken}`,
      html: `<p>Welcome to our application!</p><p>Please click the following link to activate your account: <a href="${process.env.APP_URL}/activate/${activationToken}">Activate Account</a></p>`,
    });

    res.status(201).json({ message: 'User registered successfully. Activation email sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
};


const activateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      activationToken: token,
      activationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired activation token' });
    }

    // Activate the user account
    user.isActivated = true;
    user.activationToken = null;
    user.activationExpires = null;
    await user.save();

    return res.json({ message: 'Account activated successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate account' });
  }
};

const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.isActivated) {
      return res.status(401).json({ error: 'Account not activated yet' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
};






const forgotPassword = async (req, res) => {
  const token = crypto.randomBytes(20).toString('hex');
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({ error: 'No user with such email!' });
  }

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;

  try {
    await user.save();

    // Code for sending the reset password email goes here (similar to how it was done before)
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: "KITCHEN-RECIPE-MANAGEMENT - Reset Password",
      text: `You are receiving this because you have requested the reset of the password of your account.\n\nToken: ${token}\n\nIf you didn't request this, please ignore this email and your password will remain unchanged.`,
      html: `<p>You are receiving this because you have requested the reset of the password of your account.</p><p><strong>Token: ${token}</strong></p><p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>`,
    });

    return res.json({
      message: `An email has been sent to ${user.email} with further instructions`,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Code for sending the password reset success email goes here (similar to how it was done before)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: "KITCHEN-RECIPE-MANAGEMENT - Password Reset Successful",
      text: `Your password has been reset successfully. You can now log in with your new password.`,
      html: `<p>Your password has been reset successfully.</p><p>You can now log in with your new password.</p>`,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

const getProfile = (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { register, login, forgotPassword, resetPassword, activateAccount, getProfile };
