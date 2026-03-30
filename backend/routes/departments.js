const router = require('express').Router();
const createCRUD = require('../controllers/crudFactory');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const ctrl = createCRUD(Department, 'campus institution');

router.use(protect);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
