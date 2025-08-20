// routes/generos.js
const express = require('express');
const router  = express.Router();
const gc      = require('../controllers/generosController');

// GET /generos
router.get('/', gc.index);

module.exports = router;
