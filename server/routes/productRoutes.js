const router = require('express').Router();
const {
  listProducts,
  getProduct,
  getRelated,
  newReleases,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

// Catalogue — a logged-in session is required (the shop is behind the login
// selection page). Admin write access is enforced separately below.
// NOTE: static sub-paths must be registered before the /:id catch-all.
router.get('/new-releases', protect, newReleases);
router.get('/', protect, listProducts);
router.get('/:id/related', protect, getRelated);
router.get('/:id', protect, getProduct);

// Administrator management
router.post('/', protect, requireAdmin, createProduct);
router.patch('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
