const express = require('express');
const router  = express.Router();
const { ensureLoggedIn } = require('../../controllers/adminController');
const catCtrl = require('../../controllers/adminCategoriesController');

router.use(ensureLoggedIn);

// GET  /admin/categories              → lista cards de categorias
router.get('/',            catCtrl.listCategories);

// GET  /admin/categories/new         → form para criar categoria
router.get('/new',         catCtrl.showNewForm);

// POST /admin/categories/new         → cria categoria
router.post('/new',        catCtrl.createCategory);

// GET  /admin/categories/:id/events  → lista eventos de uma categoria
router.get('/:id/events',  catCtrl.showCategoryEvents);

router.post('/new', catCtrl.createCategory);

module.exports = router;