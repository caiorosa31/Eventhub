// routes/auth.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const bcrypt  = require('bcrypt');

// Home / Lista de eventos
router.get('/', (req, res) => {
  const termo = req.query.busca || '';
  let sql, params;

  if (termo) {
    // Só eventos futuros que casem com o termo de busca
    sql = `
      SELECT *
      FROM eventos
      WHERE data_hora > NOW()
        AND titulo LIKE ?
      ORDER BY data_hora ASC
    `;
    params = [`%${termo}%`];
  } else {
    // Apenas os próximos 8 eventos
    sql = `
      SELECT *
      FROM eventos
      WHERE data_hora > NOW()
      ORDER BY data_hora ASC
      LIMIT 8
    `;
    params = [];
  }

  db.query(sql, params, (err, eventos) => {
    if (err) {
      console.error('Erro ao buscar eventos:', err);
      return res.send('Erro no banco');
    }
    res.render('index', {
      title:            'Eventos',
      eventosPopulares: eventos,
      festas:           eventos
    });
  });
});

// Exibe form de login
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Processa login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, users) => {
    if (err || users.length === 0) return res.send('Credenciais inválidas');
    const user = users[0];
    if (!bcrypt.compareSync(senha, user.senha)) {
      return res.send('Credenciais inválidas');
    }
    req.session.usuario = { id: user.id, nome: user.nome };
    res.redirect('/user/dashboard/account');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Exibe form de registro
router.get('/register', (req, res) => {
  res.render('register', { title: 'Cadastro' });
});

// Processa registro
router.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = bcrypt.hashSync(senha, 10);
  db.query(
    'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome, email, hash],
    (err, result) => {
      if (err) return res.send('Erro ao cadastrar');
      // auto-login
      req.session.usuario = { id: result.insertId, nome };
      res.redirect('/user/dashboard/account');
    }
  );
});

module.exports = router;
