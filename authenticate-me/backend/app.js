const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { environment } = require('./config');
const { ValidationError } = require('sequelize');
const isProduction = environment === 'production';

const app = express();
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());



if (!isProduction) {
    // enable cors only in development
    app.use(cors());
}

  // helmet helps set a variety of headers to better secure your app
  app.use(
    helmet.crossOriginResourcePolicy({
      policy: "cross-origin"
    })
  );

  // Set the _csrf token and create req.csrfToken method
  app.use(
    csurf({
      cookie: {
        secure: isProduction,
        sameSite: isProduction && "Lax",
        httpOnly: true
      }
    })
  );

  app.use((err, req, res, next) =>{
    err = new Error("The requested resource could not be found");
    err.status = 404;
    err.title = "Resource Not Found";
    err.errors = ["The requested resource was not found"];
    next(err);
  });

  app.use((err, req, res, next)=>{
    if (err instanceof ValidationError){
      err.errors = err.errors.map((e) => e.message);
      err.title = "Validation Error";
    }
    next(err);
  });

  // Error formatter
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack
  });
});


app.use(routes);
module.exports = app;
