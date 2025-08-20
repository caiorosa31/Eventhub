// app.js
const express = require('express');
const session = require('express-session');
const path    = require('path');

const app = express();

// 1) Parsing de body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2) Sessão — precisa vir antes de usar req.session em qualquer middleware
app.use(session({
  secret: 'eventhub_secret',
  resave: false,
  saveUninitialized: true
}));

// 3) Expor usuário, admin e busca nas views
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.admin   = req.session.admin   || null;
  res.locals.busca   = req.query.busca     || '';
  next();
});

// 4) Verificar conta de produtor (apenas uma vez!)
app.use((req, res, next) => {
  if (!req.session.usuario) {
    res.locals.isProducer = false;
    return next();
  }
  const userId = req.session.usuario.id;
  const db     = require('./config/db');
  db.query(
    'SELECT id FROM produtores WHERE usuario_id = ?',
    [userId],
    (err, results) => {
      res.locals.isProducer = !err && Array.isArray(results) && results.length > 0;
      next();
    }
  );
});

// 5) View engine e arquivos estáticos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// 6) Rotas
app.use('/',               require('./routes/auth'));      // home, login, logout, register
app.use('/events',         require('./routes/events'));    // detalhes de eventos
app.use('/generos',        require('./routes/generos'));   // explorar por gênero
app.use('/user/dashboard', require('./routes/dashboard')); // dashboard de usuário/produtor
app.use('/admin',          require('./routes/admin'));     // área de admin


// 7) Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
