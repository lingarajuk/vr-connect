const express = require('express');
const router = express.Router();
const { getMemories, saveMemory, deleteMemory } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMemories);
router.post('/', saveMemory);
router.delete('/:id', deleteMemory);

module.exports = router;
