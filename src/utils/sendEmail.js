const nodemailer = require("nodemailer");

const sendEmail = async function (options) {
  // creating transporter
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // defining mail options
  const mailOptions = {
    from: "Swagato Sarowar <swagato@sarowar.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // sending email
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
