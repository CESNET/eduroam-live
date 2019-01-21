const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
router.post('/', function(req, res, next) {
  //console.log(req.body.data);
  req.io.emit('log_ok', req.body.data);
  //res.send(req.body.data);
  res.send("");
});
// --------------------------------------------------------------------------------------
module.exports = router;
