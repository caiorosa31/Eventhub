
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Exibir formulário
exports.showRegister = (req, res) => {
  res.render('register');
};

// Processar cadastro
exports.register = (req, res) => {
  const { nome, email, senha } = req.body;

  // Verificar se o e-mail já está cadastrado
  db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
    if (err) return res.send('Erro no banco de dados');
    if (results.length > 0) {
      return res.send('E-mail já cadastrado!');
    }

    // Criptografar senha e inserir no banco
    bcrypt.hash(senha, 10, (err, hash) => {
      if (err) return res.send('Erro ao criptografar senha');

      db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hash], (err2) => {
        if (err2) return res.send('Erro ao inserir usuário');
        res.redirect('/login');
      });
    });
  });
};
