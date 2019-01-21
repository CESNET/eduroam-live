const express = require('express');
const app = express();
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require( 'fs' );
const config = require('./config/config');
const key = fs.readFileSync(config.key);
const cert = fs.readFileSync(config.cert);
const https = require('https').createServer({ key : key, cert : cert }, app);
const io = require('socket.io')(https);

// --------------------------------------------------------------------------------------

// disable express header
app.disable('x-powered-by')

// --------------------------------------------------------------------------------------
// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// --------------------------------------------------------------------------------------
// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------------------------------------------
// Make io accessible to our router
app.use(function(req, res, next){
  req.io = io;
  next();
});

// --------------------------------------------------------------------------------------
io.on('connection', function(socket){
  console.log('A new WebSocket connection has been established');
});

https.listen(8088, function() {
  console.log('Listening on *:8088');
});

// --------------------------------------------------------------------------------------
// set up routes
app.use('/', require('./routes/index'));
app.use('/data', require('./routes/data'));     // debug only
app.use('/terminal', require('./routes/terminal'));     // debug only

// --------------------------------------------------------------------------------------
require('./log_processing')(io);        // all the logic is done here
// --------------------------------------------------------------------------------------
module.exports = app;
