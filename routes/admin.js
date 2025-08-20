
const express = require('express');
const router = express.Router();
const ac = require('../controllers/adminController');

router.get('/login',    ac.showLoginForm);
router.post('/login',   ac.login);

router.get('/dashboard', ac.ensureLoggedIn, ac.showDashboard);
router.get('/logout',    ac.ensureLoggedIn, ac.logout);

router.get( '/users',            ac.ensureLoggedIn, ac.showUsers);
router.get( '/users/:id/edit',   ac.ensureLoggedIn, ac.showEditUserForm);
router.post('/users/:id/edit',   ac.ensureLoggedIn, ac.updateUser);
router.post('/users/:id/delete', ac.ensureLoggedIn, ac.deleteUser);

// **Detalhes de um usuário**  
router.get('/users/:id', ac.ensureLoggedIn, ac.showUserDetails);

router.use('/', require('./admin/events'));

router.use('/categories', require('./admin/categories'));

router.use('/feedbacks', require('./admin/feedbacks'));

module.exports = router;