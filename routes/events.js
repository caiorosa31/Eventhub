// routes/events.js
const express          = require('express');
const router           = express.Router();
const eventsController = require('../controllers/eventsController');
const ensureLoggedIn   = require('../middleware/ensureLogin');

// GET /events/:id — exibe detalhes do evento
router.get('/:id', eventsController.showEvent);

// POST /events/:id/favorite — adiciona/remove favorito (usuário deve estar logado)
router.post('/:id/favorite', ensureLoggedIn, eventsController.toggleFavorite);

// POST /events/:id/buy — compra ingresso (usuário deve estar logado)
router.post('/:id/buy', ensureLoggedIn, eventsController.buyTicket);

module.exports = router;
