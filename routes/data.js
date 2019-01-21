const express = require('express');
const router = express.Router();
// --------------------------------------------------------------------------------------
router.post('/', function(req, res, next) {
  //console.log(req.body);
  req.io.emit('update_provided', req.body);
  res.send("");
  //res.send(req.body);
});
// --------------------------------------------------------------------------------------
module.exports = router;
