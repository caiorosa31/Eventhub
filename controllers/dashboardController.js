// controllers/dashboardController.js
const db = require('../config/db');

// Middleware de proteção de rota
exports.ensureLoggedIn = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  next();
};

// GET /user/dashboard/
exports.showDashboard = (req, res) => {
  res.render('user/dashboard/index', { title: 'Meu Dashboard' });
};

// GET /user/dashboard/account
exports.showAccount = (req, res) => {
  res.render('user/dashboard/account', { title: 'Minha Conta' });
};

// GET /user/dashboard/account/edit
exports.showAccountEdit = (req, res) => {
  const user = req.session.usuario;
  res.render('user/dashboard/accountEdit', {
    title: 'Editar Conta',
    user
  });
};

// POST /user/dashboard/account/edit
exports.updateAccount = (req, res) => {
  const { nome, email } = req.body;
  const userId = req.session.usuario.id;

  db.query(
    'UPDATE usuarios SET nome=?, email=? WHERE id=?',
    [nome, email, userId],
    (err) => {
      if (err) return res.send('Erro ao atualizar conta');
      // Atualiza a sessão
      req.session.usuario.nome  = nome;
      req.session.usuario.email = email;
      res.redirect('/user/dashboard/account');
    }
  );
};

// POST /user/dashboard/account/delete
exports.deleteAccount = (req, res) => {
  const userId = req.session.usuario.id;

  // 1) Verifica eventos ativos
  db.query(
    'SELECT COUNT(*) AS cnt FROM eventos WHERE usuario_id = ? AND status = "ativo"',
    [userId],
    (err, results) => {
      if (err) return res.send('Erro ao verificar eventos ativos');
      if (results[0].cnt > 0) {
        return res.send('Remova seus eventos ativos antes de deletar a conta.');
      }

      // 2) Deleta em cascata pedidos, favoritos, ingressos, eventos, produtor e usuário
      db.query('DELETE FROM pedidos WHERE usuario_id = ?', [userId], () => {
        db.query('DELETE FROM favoritos WHERE usuario_id = ?', [userId], () => {
          db.query(
            'DELETE FROM ingressos WHERE evento_id IN (SELECT id FROM eventos WHERE usuario_id = ?)',
            [userId],
            () => {
              db.query('DELETE FROM eventos WHERE usuario_id = ?', [userId], () => {
                db.query('DELETE FROM produtores WHERE usuario_id = ?', [userId], () => {
                  db.query('DELETE FROM usuarios WHERE id = ?', [userId], () => {
                    req.session.destroy();
                    res.redirect('/');
                  });
                });
              });
            }
          );
        });
      });
    }
  );
};


exports.showTickets = (req, res) => {
  const userId = req.session.usuario.id;
  const sql = `
    SELECT 
      p.*, 
      e.titulo, 
      e.data_hora AS dataHora, 
      e.local
    FROM pedidos p
    JOIN eventos e 
      ON e.id = p.evento_id
    WHERE p.usuario_id = ?
    ORDER BY e.data_hora DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar ingressos:', err);
      // Em caso de erro, renderiza sem ingressos
      return res.render('user/dashboard/tickets', {
        title:    'Meus Ingressos',
        ingressos: []
      });
    }

    // Sucesso: envia resultados (ou array vazio)
    res.render('user/dashboard/tickets', {
      title:    'Meus Ingressos',
      ingressos: Array.isArray(results) ? results : []
    });
  });
};



// GET /user/dashboard/favorites
// controllers/dashboardController.js

exports.showFavorites = (req, res) => {
  const userId = req.session.usuario.id;

  const sql = `
    SELECT 
      e.id,
      e.titulo,
      e.imagem,
      e.data_hora
    FROM favoritos f
    JOIN eventos e ON f.evento_id = e.id
    WHERE f.usuario_id = ?
    ORDER BY f.id DESC
  `;

  db.query(sql, [userId], (err, favorites) => {
    if (err) {
      console.error('Erro ao buscar favoritos:', err);
      favorites = [];
    }
    res.render('user/dashboard/favorites', {
      title:     'Meus Favoritos',
      busca:     req.query.busca || '',
      usuario:   req.session.usuario,
      favorites
    });
  });
};

exports.showTickets = (req, res) => {
  const userId = req.session.usuario.id;

  const sql = `
    SELECT 
      p.id,
      p.quantidade,
      p.valor,
      p.data_pedido   AS dataHora,
      e.titulo,
      e.data_hora     AS eventoDateTime,
      e.local         AS eventoLocal,
      i.nome          AS tipoIngresso,
      i.preco,
      -- verifica se já existe feedback para este usuário+evento
      CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS jaAvaliado
    FROM pedidos p
    JOIN eventos e    ON p.evento_id = e.id
    JOIN ingressos i  ON p.ingresso_id = i.id
    LEFT JOIN feedbacks f
      ON f.usuario_id = ? AND f.evento_id = p.evento_id
    WHERE p.usuario_id = ?
    ORDER BY p.data_pedido DESC
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar ingressos:', err);
      return res.render('user/dashboard/tickets', {
        title:     'Meus Ingressos',
        ingressos: []
      });
    }

    const ingressos = results.map(p => ({
      id:             p.id,
      quantidade:     p.quantidade,
      valorTotal:     parseFloat(p.valor).toFixed(2),
      dataPedido:     new Date(p.dataHora).toLocaleString('pt-BR'),
      eventoTitulo:   p.titulo,
      eventoDateTime: p.eventoDateTime,
      eventoData:     new Date(p.eventoDateTime).toLocaleString('pt-BR'),
      eventoLocal:    p.eventoLocal,
      precoUnitario:  parseFloat(p.preco),
      jaAvaliado:     p.jaAvaliado === 1
    }));

    res.render('user/dashboard/tickets', {
      title:     'Meus Ingressos',
      ingressos
    });
  });
};

// DETALHE de um ingresso
exports.showTicketDetail = (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);
  const userId   = req.session.usuario.id;

  const sql = `
    SELECT p.id, p.quantidade, p.valor, p.data_pedido AS dataHora,
           e.titulo, e.data_hora AS eventoData, e.local, e.imagem,
           i.nome AS tipoIngresso, i.preco,
           u.nome AS comprador, u.email
    FROM pedidos p
    JOIN eventos e    ON p.evento_id = e.id
    JOIN ingressos i  ON p.ingresso_id = i.id
    JOIN usuarios u   ON p.usuario_id = u.id
    WHERE p.id = ? AND p.usuario_id = ?
  `;
  db.query(sql, [pedidoId, userId], (err, rows) => {
    if (err || rows.length === 0) {
      console.error('Erro ao buscar detalhe do ingresso:', err);
      return res.status(404).send('Ingresso não encontrado');
    }
    const p = rows[0];
    const detail = {
      id          : p.id,
      quantidade  : p.quantidade,
      valorTotal  : parseFloat(p.valor).toFixed(2),
      dataHora    : new Date(p.dataHora).toLocaleString('pt-BR'),
      eventoTitulo: p.titulo,
      eventoData  : new Date(p.eventoData).toLocaleString('pt-BR'),
      eventoLocal : p.local,
      ticketType  : p.tipoIngresso,
      precoUnit   : parseFloat(p.preco).toFixed(2),
      comprador   : p.comprador,
      email       : p.email,
      imagem      : p.imagem
    };
    res.render('user/dashboard/ticketDetail', {
      title:       `Ingresso #${detail.id}`,
      pedido:      detail
    });
  });
};

exports.showFeedbackForm = (req, res) => {
  const pedidoId = parseInt(req.params.id, 10);

  // Buscar detalhes básicos para contextualizar (nome do evento, data-hora, etc.)
  const sql = `
    SELECT p.id AS pedidoId,
           e.id AS eventoId,
           e.titulo AS eventoTitulo,
           e.data_hora AS eventoDataHora
    FROM pedidos p
    JOIN eventos e ON p.evento_id = e.id
    WHERE p.id = ? AND p.usuario_id = ?
  `;
  db.query(sql, [pedidoId, req.session.usuario.id], (err, rows) => {
    if (err || rows.length === 0) {
      console.error('Erro ao buscar pedido para feedback:', err);
      return res.status(404).send('Pedido não encontrado ou não pertence a você.');
    }

    const pedido = rows[0];
    res.render('user/dashboard/feedbackForm', {
      title: 'Dar Feedback',
      pedido,
      error: null
    });
  });
};


// 6) Recebe e grava o feedback no banco
exports.submitFeedback = (req, res) => {
  const pedidoId   = parseInt(req.params.id, 10);
  const { nota, comentario } = req.body;
  const userId     = req.session.usuario.id;

  // Primeiro, obter o evento_id associado ao pedido
  const sqlGetEvento = `
    SELECT evento_id 
    FROM pedidos 
    WHERE id = ? AND usuario_id = ?
  `;
  db.query(sqlGetEvento, [pedidoId, userId], (err1, rows1) => {
    if (err1 || rows1.length === 0) {
      console.error('Pedido para feedback não encontrado:', err1);
      return res.status(404).send('Pedido inválido.');
    }
    const eventoId = rows1[0].evento_id;

    // Verificar se o usuário já enviou feedback para este evento
    const sqlCheck = `
      SELECT 1 
      FROM feedbacks 
      WHERE usuario_id = ? AND evento_id = ?
    `;
    db.query(sqlCheck, [userId, eventoId], (err2, rows2) => {
      if (err2) {
        console.error('Erro ao checar feedback existente:', err2);
        return res.status(500).send('Erro interno.');
      }
      if (rows2.length > 0) {
        // Já enviou feedback
        return res.render('user/dashboard/feedbackForm', {
          title: 'Dar Feedback',
          pedido: { id: pedidoId, eventoTitulo: '', eventoDataHora: null },
          error: 'Você já avaliou este evento.'
        });
      }

      // Insere o feedback
      const sqlInsert = `
        INSERT INTO feedbacks (usuario_id, evento_id, nota, comentario)
        VALUES (?, ?, ?, ?)
      `;
      db.query(sqlInsert, [userId, eventoId, parseInt(nota, 10), comentario], err3 => {
        if (err3) {
          console.error('Erro ao inserir feedback:', err3);
          return res.status(500).send('Falha ao gravar feedback.');
        }
        // Redireciona de volta para os ingressos
        res.redirect('/user/dashboard/tickets');
      });
    });
  });
};