
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Exibir formulário de cadastro
exports.showRegister = (req, res) => {
  res.render('register');
};

// Processar cadastro
exports.register = (req, res) => {
  const { nome, email, senha } = req.body;

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err) return res.send('Erro no banco de dados');
    if (results.length > 0) {
      return res.send('E-mail já cadastrado!');
    }

    bcrypt.hash(senha, 10, (err, hash) => {
      if (err) return res.send('Erro ao criptografar senha');

      db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash], (err2, result) => {
        if (err2) return res.send('Erro ao inserir usuário');
        // auto login
        req.session.usuario = { id: result.insertId, nome, tipo: 'usuario' };
        res.redirect('/user/dashboard/account');
      });
    });
  });
};

// Exibir formulário de login
exports.showLogin = (req, res) => {
  res.render('login');
};

// Processar login
exports.login = (req, res) => {
  const { email, senha } = req.body;

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err) return res.send('Erro ao consultar usuário');
    if (results.length === 0) return res.send('Usuário não encontrado');

    const usuario = results[0];

    bcrypt.compare(senha, usuario.senha, (err, match) => {
      if (err) return res.send('Erro ao validar senha');
      if (!match) return res.send('Senha incorreta');

      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        tipo: usuario.tipo
      };

      res.redirect('/user/dashboard/account');
    });
  });
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/user/dashboard/account');
};
