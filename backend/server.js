const express = require('express')
const app = express()
const {PORT} = require('./config/index.js');
const dbConnect = require('./database/index.js');
const router = require('./routes/index.js');
const errorhandler = require('./middleware/errorHandler.js')
const cookieParser = require('cookie-parser');

dbConnect();
app.use(cookieParser());
app.use(express.json());
app.use(router);

app.use('/storage',express.static('storage'));
app.use(errorhandler);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})