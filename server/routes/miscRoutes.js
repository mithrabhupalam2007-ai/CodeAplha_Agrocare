const router = require('express').Router();
const { listCategories, subscribe } = require('../controllers/categoryController');

router.get('/categories', listCategories);
router.post('/newsletter', subscribe);

module.exports = router;
