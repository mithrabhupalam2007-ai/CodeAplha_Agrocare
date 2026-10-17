const router = require('express').Router();
const {
  dashboard,
  listProducts: listProductsAdmin,
  getProductAdmin,
  listOutOfStock,
  updatePrice,
  updateStock,
  updateAvailability,
  listOrders,
  updateOrderStatus,
  listCustomers,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/adminController');
const {
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/auth');

// Everything under /api/admin needs a valid login AND the admin role.
router.use(protect, requireAdmin);

router.get('/dashboard', dashboard);

router.get('/products', listProductsAdmin);
router.post('/products', createProduct);
// Static sub-paths must be registered before the /:id catch-all:
router.get('/products/out-of-stock', listOutOfStock);
router.get('/products/:id', getProductAdmin);
router.patch('/products/:id', updateProduct);
router.patch('/products/:id/price', updatePrice);
router.patch('/products/:id/stock', updateStock);
router.patch('/products/:id/availability', updateAvailability);
router.delete('/products/:id', deleteProduct);

router.get('/orders', listOrders);
router.patch('/orders/:id', updateOrderStatus);

router.get('/customers', listCustomers);

router.get('/categories', listAllCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
