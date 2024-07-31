var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cors = require('cors');

var indexRouter = require('./routes/agenda');
var todoRouter = require('./routes/todo');
var financeRouter = require('./routes/finance');
var userRouter = require('./routes/user');

var app = express();
var port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/agenda', indexRouter);
app.use('/todo', todoRouter);
app.use('/finance', financeRouter);
app.use('/user', userRouter);

app.use(function (req, res, next) {
  res.status(404).json({ error: 'Not Found' });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

app.listen(port, function () {
  console.log('Server running on port', port);
});

module.exports = app;
