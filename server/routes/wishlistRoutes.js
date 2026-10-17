const router = require('express').Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Convenience aliases so the wishlist is also reachable at /api/wishlist/*
// (the canonical routes live under /api/users/wishlist and share handlers).
router.use(protect);
router.get('/', getWishlist);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
