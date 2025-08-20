// routes/dashboard.js

const express = require('express');
const router  = express.Router();
const dc      = require('../controllers/dashboardController');
const pc      = require('../controllers/producerController');
const multer  = require('multer');

const ensureLoggedIn = dc.ensureLoggedIn;
const upload         = multer({ dest: 'public/uploads/' });

// ─────────── Rotas do usuário (/user/dashboard) ───────────

// Painel principal
router.get('/', ensureLoggedIn, dc.showDashboard);

// Minha Conta
router.get('/account',      ensureLoggedIn, dc.showAccount);
router.get('/account/edit', ensureLoggedIn, dc.showAccountEdit);
router.post('/account/edit', ensureLoggedIn, dc.updateAccount);
router.post('/account/delete', ensureLoggedIn, dc.deleteAccount);

// Meus Ingressos
router.get('/tickets',       ensureLoggedIn, dc.showTickets);
router.get('/tickets/:id',   ensureLoggedIn, dc.showTicketDetail);
router.get('/tickets/:id/feedback',  ensureLoggedIn, dc.showFeedbackForm);
router.post('/tickets/:id/feedback', ensureLoggedIn, dc.submitFeedback);

// Favoritos
router.get('/favorites', ensureLoggedIn, dc.showFavorites);

// ─────────── Rotas do produtor (ainda em /user/dashboard) ───────────

// Ver ou registrar Produtor
router.get('/producer',  ensureLoggedIn, pc.showProducer);
router.post('/producer', ensureLoggedIn, pc.registerProducer);

// Criar Evento
router.get('/producer/create-event',  ensureLoggedIn, pc.showCreateEventForm);
router.post('/producer/create-event', ensureLoggedIn, upload.single('imagem'), pc.createEvent);

// Editar Evento
router.get('/producer/edit-event/:id',  ensureLoggedIn, pc.showEditEventForm);
router.post('/producer/edit-event/:id', ensureLoggedIn, upload.single('imagem'), pc.updateEvent);

// Deletar Evento
router.post('/producer/delete-event/:id', ensureLoggedIn, pc.deleteEvent);

// Ver Feedbacks de um Evento
router.get('/producer/feedbacks/:eventId', ensureLoggedIn, pc.showEventFeedbacks);

module.exports = router;
