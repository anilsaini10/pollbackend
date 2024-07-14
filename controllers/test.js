const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const url = require("../helper/constant");

const app = express();
const PORT = 3000;

// Replace 'your_mongodb_uri' with your actual MongoDB Atlas connection string
const mongoURI = url;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  resetToken: String,
  resetTokenExpiration: Date,
});

const User = mongoose.model('User', userSchema);


// Nodemailer setup - replace with your email provider's settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password',
  },
});

// Password reset request endpoint
app.post('/reset_request', async (req, res) => {
  try {
    // const { email } = req.body;

    // const user = await User.findOne({ email });
    // // if (!user) {
    // //   return res.status(404).json({ error: 'User not found' });
    // // }

    // // Generate a random reset token
    // const resetToken = crypto.randomBytes(32).toString('hex');
    // const resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour

    // // Save the token and expiration date in the user document
    // user.resetToken = resetToken;
    // user.resetTokenExpiration = resetTokenExpiration;
    // await user.save();

    // Send the reset email
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: 'anilsainik10@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Password reset endpoint
app.post('/reset-password/:token', async (req, res) => {
  
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
