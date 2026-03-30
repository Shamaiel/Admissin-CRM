const router = require('express').Router();
const ctrl = require('../controllers/admissionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getAll);
router.get('/by-applicant/:applicantId', ctrl.getByApplicant);
router.get('/:id', ctrl.getOne);
router.post('/', authorize('admin', 'admission_officer'), ctrl.createAdmission);
router.post('/:id/confirm', authorize('admin', 'admission_officer'), ctrl.confirmAdmission);
router.post('/:id/cancel', authorize('admin'), ctrl.cancelAdmission);

module.exports = router;
