const router = require('express').Router();
const {
  getProfile,
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect); // every route below requires a logged-in user

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;
