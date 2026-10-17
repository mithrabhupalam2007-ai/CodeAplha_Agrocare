const router = require('express').Router();
const { register, login, me, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimit');

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);
router.post('/logout', logout);

module.exports = router;
