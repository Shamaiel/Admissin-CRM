const router = require('express').Router();
const { getSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', getSummary);

module.exports = router;
