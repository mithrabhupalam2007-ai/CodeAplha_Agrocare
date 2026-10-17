const router = require('express').Router();
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

// Public catalogue
router.get('/', listProducts);
router.get('/:id', getProduct);

// Administrator management
router.post('/', protect, requireAdmin, createProduct);
router.patch('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
