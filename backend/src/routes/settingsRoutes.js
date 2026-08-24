const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSettings);
router.patch('/', updateSettings);

module.exports = router;
