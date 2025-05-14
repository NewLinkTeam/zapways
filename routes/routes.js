const express = require('express')
const router = express.Router()

const searchController = require('../controllers/searchcontroller')
const bookController = require('../controllers/bookcontroller')
const cancelController = require('../controllers/cancelcontroller')

// Middleware to ensure request body exists
const ensureBodyExists = (req, res, next) => {

  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Request body is missing or empty');
    return res.status(400).json({
      success: false,
      error: 'Invalid request',
      details: 'Request body is missing or empty'
    });
  }
  
  next();
};

// Routes with body validators
router.post('/searchlowfare', ensureBodyExists, searchController.index)

router.post('/bookflight', ensureBodyExists, bookController.index)

router.post('/cancelflight', ensureBodyExists, cancelController.index)

module.exports = router
