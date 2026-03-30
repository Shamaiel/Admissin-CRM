const router = require('express').Router();
const createCRUD = require('../controllers/crudFactory');
const AcademicYear = require('../models/AcademicYear');
const { protect, authorize } = require('../middleware/auth');
const ctrl = createCRUD(AcademicYear);

router.use(protect);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);

module.exports = router;
