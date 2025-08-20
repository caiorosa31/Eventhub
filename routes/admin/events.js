// routes/admin/events.js
const express = require('express');
const router = express.Router();
const path   = require('path');
const multer = require('multer');

// 🔑 Ajuste nos paths: estamos em routes/admin/, subimos duas vezes para chegar em controllers/
const { ensureLoggedIn }      = require('../../controllers/adminController');
const eventsCtrl              = require('../../controllers/adminEventsController');

// Configura upload (caso deseje permitir troca de imagem)
const upload = multer({
  dest: path.join(__dirname, '../../public/uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// Todas as rotas aqui requerem admin autenticado
router.use(ensureLoggedIn);

// GET  /admin/events          → lista todos os eventos
router.get('/events',           eventsCtrl.list);

// GET  /admin/events/:id/edit  → formulário de edição
router.get('/events/:id/edit',  eventsCtrl.showEditForm);

// POST /admin/events/:id/edit  → processa atualização
router.post('/events/:id/edit', upload.single('imagem'), eventsCtrl.update);

// POST /admin/events/:id/delete→ exclui o evento
router.post('/events/:id/delete', eventsCtrl.delete);

module.exports = router;
