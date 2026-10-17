const router = require('express').Router();
const { createOrder, listMyOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// NOTE: "/my" must be registered before "/:id" or it would be shadowed.
router.post('/', protect, createOrder);
router.get('/my', protect, listMyOrders);
router.get('/:id', protect, getOrder);
router.patch('/:id/cancel', protect, cancelOrder);

module.exports = router;
