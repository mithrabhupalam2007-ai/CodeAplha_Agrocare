const router = require('express').Router();
const {
  dashboard,
  listProducts: listProductsAdmin,
  listOrders,
  updateOrderStatus,
  listCustomers,
  listAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

// Everything under /api/admin needs a valid login AND the admin role.
router.use(protect, requireAdmin);

router.get('/dashboard', dashboard);

router.get('/products', listProductsAdmin);

router.get('/orders', listOrders);
router.patch('/orders/:id', updateOrderStatus);

router.get('/customers', listCustomers);

router.get('/categories', listAllCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
