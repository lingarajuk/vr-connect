const express = require('express');
const router = express.Router();
const {
  getLinkedAccounts,
  directLinkGoogle,
  unlinkGoogle,
} = require('../controllers/oauthController');
const { protect } = require('../middleware/authMiddleware');

router.get('/linked', protect, getLinkedAccounts);
router.post('/google/link', protect, directLinkGoogle);
router.delete('/google', protect, unlinkGoogle);

module.exports = router;
