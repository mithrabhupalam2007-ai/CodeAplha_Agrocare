const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { listCategories, subscribe } = require('../controllers/categoryController');

// Category list backs the logged-in home page / catalogue filters.
router.get('/categories', protect, listCategories);
router.post('/newsletter', subscribe);

module.exports = router;
