// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   //1) Create a transporter
//   //transporter is the service that will send the mail like gmail
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     service: 'Gmail',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     //Activate in gmail "less secure app" option
//   });

//   const mailOptions = {
//     from: 'Aagam Jain <jainaagam28@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };
//   // console.log('ha bhai ');
//   console.log(mailOptions);
//   //3) Actually send the mail
//   await transporter.sendMail(mailOptions);
//   console.log('ha bhai 3 ');
// };
async function wrapedSendMail(mailOptions) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //Activate in gmail "less secure app" option
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`error is   ${error}`);
        resolve(false); // or use rejcet(false) but then you will have to handle errors
      } else {
        console.log(`Email sent:   ${info.response}`);
        resolve(true);
      }
    });
  });
}

const sendEmail = async (options) => {
  const mailOptions = {
    from: 'Aagam Jain <jainaagam28@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  const resp = await wrapedSendMail(mailOptions);
  // log or process resp;
  return resp;
};

module.exports = sendEmail;
