const router = require('express').Router();
const ctrl = require('../controllers/applicantController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('admin', 'admission_officer'), ctrl.create);
router.put('/:id', authorize('admin', 'admission_officer'), ctrl.update);

// Seat allocation
router.post('/:id/allocate-seat', authorize('admin', 'admission_officer'), ctrl.allocateSeat);

// Document management
router.patch('/:id/document', authorize('admin', 'admission_officer'), ctrl.updateDocument);

// Fee status
router.patch('/:id/fee', authorize('admin', 'admission_officer'), ctrl.updateFeeStatus);

module.exports = router;
