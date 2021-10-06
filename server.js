import { readdirSync } from 'fs';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
const bodyParser = require('body-parser');
const morgan = require('morgan');
const expressValidator = require('express-validator');
import mongoose from 'mongoose';
require('dotenv').config();

// create app
const app = express();

// db

mongoose
  .connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // usefindandmodify: false,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
  })
  .then(() => console.log('*****DATABASE IS READY'))
  .catch((err) => {
    console.log('DB CONNECTION ERR=>', err);
  });

// middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());
// routes

// auto load routes
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));

// port
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is runing on http://localhost:${port}`);
});
