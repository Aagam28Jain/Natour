const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! shutting down app ...');
  console.log(err.name, err.message);

  process.exit(1);
});
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

//this connect method is going to return a promise
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(' DB connection succesfull');
  });

const port = process.env.PORT || 3008;
const server = app.listen(port, () => {
  console.log(`hey the server is running on ${port}...`);
});
// it handles only asynchorous errors
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! shutting down app ...');
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
