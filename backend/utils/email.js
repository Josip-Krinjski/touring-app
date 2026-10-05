const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message }) => {
  const account = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  const info = await transporter.sendMail({
    from: 'Natours <no-reply@natours.dev>',
    to: email,
    subject,
    text: message,
  });

  console.log('Preview email:', nodemailer.getTestMessageUrl(info));

  return info;
};

module.exports = sendEmail;
