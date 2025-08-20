// routes/admin/feedbacks.js
const express = require('express');
const router  = express.Router();
const { ensureLoggedIn } = require('../../controllers/adminController');
const fbCtrl  = require('../../controllers/adminFeedbacksController');

router.use(ensureLoggedIn);

// GET  /admin/feedbacks         → lista todos os feedbacks
router.get('/',           fbCtrl.list);

// GET  /admin/feedbacks/:id    → detalhe de um feedback
router.get('/:id',        fbCtrl.showDetail);

// POST /admin/feedbacks/:id/delete → exclui o feedback
router.post('/:id/delete', fbCtrl.delete);

module.exports = router;
