const nodemailer = require('nodemailer');



const URL = "mongodb+srv://anilsaini:anilsaini@cluster0.4bvjjyj.mongodb.net/?retryWrites=true&w=majority";

// Nodemailer setup - replace with your email provider's settings
const TRASNPORTER = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anilsainik10@gmail.com',
    pass: 'ycaq xyfb bygt dpzw',
  },
});


const autoGeneratePassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=';
  let password = '';

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}


module.exports = {
  URL: URL,
  TRASNPORTER: TRASNPORTER,
  autoGeneratePassword: autoGeneratePassword
};