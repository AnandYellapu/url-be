const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    console.log('Received registration request:', { username, email }); // Log request data

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create an inactive user account
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isActivated: false, // Set the isActivated property to false initially
    });
    console.log('User created:', user); // Log user data

    // Generate an activation token
    const activationToken = crypto.randomBytes(20).toString('hex');
    user.activationToken = activationToken;
    user.activationExpires = Date.now() + 3600000; // Token expiration time (1 hour)

    // Save the user with the activation token and expiration
    await user.save();
    console.log('User saved with activation token:', user.activationToken); // Log activation token

    // // Code for sending the activation email
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    let info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: "URL-SHORTENER - Account Activation",
      html: `
        <div style="background-color: #f7f7f7; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; font-size: 24px; margin-bottom: 20px;">Welcome to Our Application!</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">Thank you for joining our platform. To activate your account, please click the button below:</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.APP_URL}/activate/${activationToken}" style="display: inline-block; background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">Activate Account</a>
            </div>
          </div>
        </div>
      `,
    });
    console.log('Activation email sent:', info); // Log email sent information
    
    res.status(201).json({ message: 'User registered successfully. Activation email sent.' });
    } catch (error) {
    console.error('Error registering user:', error); // Log error
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

    // Include the userId and role in the token payload
    const tokenPayload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);

    // Include the userId and role in the response
    res.status(200).json({
      user: {
        _id: user._id,
        // Include other user properties as needed
      },
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // Token expiration time (1 hour)

    // Update user document with reset token and expiration
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send password reset email
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: 'URL-SHORTENER - Password Reset',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${process.env.APP_URL}/reset-password/${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      html: `
        <div style="background-color: #f7f7f7; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; font-size: 24px; margin-bottom: 20px;">Password Reset Request</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">Please click on the following button to reset your password:</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.APP_URL}/reset-password/${resetToken}" style="display: inline-block; background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #333; font-size: 16px; line-height: 1.5;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        </div>
      `,
    });
    

    console.log('Password reset email sent:', info); // Log email sent information

    res.status(200).json({ message: 'Password reset email sent. Check your inbox.' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
};




const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Find user by reset token
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      console.log('User not found or invalid token:', token);
      return res.status(404).json({ error: 'User not found or invalid token' });
    }

    // Check if the token has expired
    if (user.resetPasswordExpires < Date.now()) {
      console.log('Password reset token has expired:', token);
      return res.status(400).json({ error: 'Password reset token has expired' });
    }

    // Update password and clear reset token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Send password reset confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_USERNAME,
      to: user.email,
      subject: 'Password Reset Confirmation',
      text: 'Your password has been successfully reset.',
    });

    console.log('Password reset confirmation email sent:', info);

    console.log('Password reset successful for user:', user.email);
    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    
    // Log specific errors
    if (error.name === 'ValidationError') {
      console.error('Validation Error:', error.message);
      return res.status(400).json({ error: 'Validation Error', message: error.message });
    }

    return res.status(500).json({ error: 'Failed to reset password' });
  }
};



const getProfile = (req, res) => {
  res.status(200).json({ user: req.user });
};


module.exports = { register, login, activateAccount, forgotPassword, resetPassword, getProfile };
