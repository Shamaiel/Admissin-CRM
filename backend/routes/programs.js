const router = require('express').Router();
const ctrl = require('../controllers/programController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);


router.get('/', ctrl.getAll);
router.get('/:programId/availability/:quotaType', ctrl.checkAvailability);

router.get('/:id', ctrl.getOne);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
