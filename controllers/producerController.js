// controllers/producerController.js
const db = require('../config/db');

exports.showProducer = (req, res) => {
  const userId = req.session.usuario.id;

  // 1) Verifica se o usuário é produtor
  db.query(
    'SELECT id FROM produtores WHERE usuario_id = ?',
    [userId],
    (err, producerRows) => {
      if (err) {
        console.error('Erro ao verificar produtor:', err);
        return res.status(500).send('Erro interno');
      }
      if (producerRows.length === 0) {
        // não é produtor: mostra formulário de registro
        return res.render('user/dashboard/producerRegister', {
          title: 'Cadastro de Produtor'
        });
      }

      // 2) Calcula estatísticas de vendas
      const statsSql = `
        SELECT
          IFNULL(SUM(p.valor), 0)       AS totalRevenue,
          IFNULL(SUM(p.quantidade), 0)  AS totalTicketsSold
        FROM pedidos p
        JOIN eventos e ON e.id = p.evento_id
        WHERE e.usuario_id = ?
      `;
      db.query(statsSql, [userId], (err2, statsRows) => {
        if (err2) {
          console.error('Erro ao calcular estatísticas:', err2);
          return res.status(500).send('Erro interno');
        }

        // converte para number
        const totalRevenue     = parseFloat(statsRows[0].totalRevenue)     || 0;
        const totalTicketsSold = parseInt(statsRows[0].totalTicketsSold, 10) || 0;
        const availableBalance = parseFloat((totalRevenue * 0.80).toFixed(2));

        // 3) Busca eventos criados por este produtor
        db.query(
          `SELECT
             id,
             titulo,
             DATE_FORMAT(data_hora, '%Y-%m-%d %H:%i') AS dataHora,
             local,
             imagem,
             idade
           FROM eventos
           WHERE usuario_id = ?
           ORDER BY data_hora DESC`,
          [userId],
          (err3, myEvents) => {
            if (err3) {
              console.error('Erro ao buscar eventos do produtor:', err3);
              myEvents = [];
            }

            // 4) Renderiza dashboard com métricas e lista de eventos
            res.render('user/dashboard/producerDashboard', {
              title:             'Painel Produtor',
              totalRevenue,
              totalTicketsSold,
              availableBalance,
              eventCount:        myEvents.length,
              myEvents
            });
          }
        );
      });
    }
  );
};

// processar cadastro de produtor
exports.registerProducer = (req, res) => {
  const userId = req.session.usuario.id;
  const { cpf, banco, agencia, conta, endereco } = req.body;

  db.query(
    `INSERT INTO produtores
       (usuario_id, cpf, banco, agencia, conta, endereco)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, cpf, banco, agencia, conta, endereco],
    err => {
      if (err) {
        console.error('Erro ao cadastrar produtor:', err);
        return res.status(500).send('Falha ao cadastrar produtor');
      }
      res.redirect('/user/dashboard/producer/create-event');
    }
  );
};

// exibir formulário de criação de evento
exports.showCreateEventForm = (req, res) => {
  db.query('SELECT id, nome FROM categorias', (err, categories) => {
    if (err) {
      console.error('Erro ao carregar categorias:', err);
      categories = [];
    }
    res.render('user/dashboard/producerCreateEvent', {
      title:      'Criar Evento',
      error:      null,
      categories
    });
  });
};

// processar criação de evento
exports.createEvent = (req, res) => {
  const userId = req.session.usuario.id;
  const {
    tipo,
    titulo,
    descricao,
    local,
    dataHora,
    idade,
    categoria_id,
    ingressoNome,
    ingressoPreco,
    ingressoQtd
  } = req.body;

  if (!dataHora) {
    return res.render('user/dashboard/producerCreateEvent', {
      title:      'Criar Evento',
      error:      'Data e hora são obrigatórias',
      categories: []
    });
  }

  const formattedDate = dataHora.replace('T', ' ') + ':00';
  const imagemPath    = req.file ? '/uploads/' + req.file.filename : null;

  const sqlEvent = `
    INSERT INTO eventos
      (usuario_id, tipo, titulo, descricao, local, data_hora, idade, imagem, categoria_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const paramsEvent = [
    userId, tipo, titulo, descricao,
    local || null, formattedDate, idade,
    imagemPath, categoria_id
  ];

  db.query(sqlEvent, paramsEvent, (err, result) => {
    if (err) {
      console.error('Erro ao criar evento:', err);
      return res.render('user/dashboard/producerCreateEvent', {
        title:      'Criar Evento',
        error:      'Falha ao criar evento: ' + err.message,
        categories: []
      });
    }

    const eventId = result.insertId;
    const sqlTicket = `
      INSERT INTO ingressos
        (evento_id, nome, preco, quantidade)
      VALUES (?, ?, ?, ?)
    `;
    const paramsTicket = [
      eventId,
      ingressoNome,
      parseFloat(ingressoPreco),
      parseInt(ingressoQtd, 10)
    ];

    db.query(sqlTicket, paramsTicket, err2 => {
      if (err2) {
        console.error('Erro ao criar ingresso:', err2);
        return res.render('user/dashboard/producerCreateEvent', {
          title:      'Criar Evento',
          error:      'Evento criado, mas falha ao criar ingresso: ' + err2.message,
          categories: []
        });
      }
      res.redirect('/user/dashboard/producer');
    });
  });
};

exports.showEditEventForm = (req, res) => {
  const userId = req.session.usuario.id;
  const eventId = parseInt(req.params.id, 10);

  // Carrega categorias para o select
  db.query('SELECT id, nome FROM categorias', (err, categories) => {
    if (err) {
      console.error('Erro ao carregar categorias:', err);
      categories = [];
    }
    // Carrega dados do evento e do ingresso único
    const sql = `
      SELECT e.*, i.nome AS ingressoNome, i.preco AS ingressoPreco, i.quantidade AS ingressoQtd
      FROM eventos e
      JOIN ingressos i ON i.evento_id = e.id
      WHERE e.id = ? AND e.usuario_id = ?
    `;
    db.query(sql, [eventId, userId], (err2, rows) => {
      if (err2 || rows.length === 0) {
        console.error('Erro ao carregar evento para edição:', err2);
        return res.status(404).send('Evento não encontrado');
      }
      const row = rows[0];
      // converter data_hora para formato datetime-local
      const dtLocal = new Date(row.data_hora)
        .toISOString()
        .slice(0,16);
      res.render('user/dashboard/producerEditEvent', {
        title:        'Editar Evento',
        error:        null,
        categories,
        event: {
          id:           row.id,
          tipo:         row.tipo,
          titulo:       row.titulo,
          descricao:    row.descricao,
          local:        row.local,
          dataHora:     dtLocal,
          idade:        row.idade,
          categoria_id: row.categoria_id,
          imagem:       row.imagem
        },
        ticket: {
          nome:       row.ingressoNome,
          preco:      row.ingressoPreco,
          quantidade: row.ingressoQtd
        }
      });
    });
  });
};

/**
 * POST /producer/edit-event/:id
 * Atualiza o evento e seu ingresso.
 */
exports.updateEvent = (req, res) => {
  const userId = req.session.usuario.id;
  const eventId = parseInt(req.params.id, 10);
  const {
    tipo,
    titulo,
    descricao,
    local,
    dataHora,
    idade,
    categoria_id,
    ingressoNome,
    ingressoPreco,
    ingressoQtd
  } = req.body;

  // reformatar datetime-local
  const formattedDate = dataHora.replace('T',' ') + ':00';

  // caminho da imagem (se nova upload)
  const imagemPath = req.file
    ? '/uploads/' + req.file.filename
    : null;

  // 1) Atualiza tabela eventos
  const fields = [
    tipo, titulo, descricao,
    local || null, formattedDate,
    idade, categoria_id, userId, eventId
  ];
  let sqlEvent = `
    UPDATE eventos
    SET tipo=?, titulo=?, descricao=?,
        local=?, data_hora=?, idade=?, categoria_id=?
    WHERE usuario_id=? AND id=?
  `;
  if (imagemPath) {
    sqlEvent = `
      UPDATE eventos
      SET tipo=?, titulo=?, descricao=?,
          local=?, data_hora=?, idade=?, categoria_id=?, imagem=?
      WHERE usuario_id=? AND id=?
    `;
    fields.splice(7,0,imagemPath); // insere imagemPath antes de userId, eventId
  }

  db.query(sqlEvent, fields, err => {
    if (err) {
      console.error('Erro ao atualizar evento:', err);
      return res.render('user/dashboard/producerEditEvent', {
        title:    'Editar Evento',
        error:    'Falha ao salvar evento',
        categories: [],         // idealmente recarregar categorias
        event:      req.body,   // exibir valores submetidos
        ticket:     { nome: ingressoNome, preco: ingressoPreco, quantidade: ingressoQtd }
      });
    }

      // 2) Atualiza ingresso
      const sqlTicket = `
        UPDATE ingressos
        SET nome=?, preco=?, quantidade=?
        WHERE evento_id=?
      `;
      db.query(
        sqlTicket,
        [ingressoNome, parseFloat(ingressoPreco), parseInt(ingressoQtd,10), eventId],
        err2 => {
          if (err2) console.error('Erro ao atualizar ingresso:', err2);
          // volta ao painel do produtor
          res.redirect('/user/dashboard/producer');
        }
      );
    });
};

exports.deleteEvent = (req, res) => {
    const userId  = req.session.usuario.id;
    const eventId = parseInt(req.params.id, 10);

    // 1) Confirma que o produtor é dono do evento
    db.query(
      'SELECT 1 FROM eventos WHERE id = ? AND usuario_id = ?',
      [eventId, userId],
      (err, rows) => {
        if (err || rows.length === 0) {
          console.error('Evento não encontrado ou sem permissão:', err);
          return res.status(404).send('Evento não encontrado');
        }

        // 2) Exclusão em cascata: pedidos → favoritos → feedbacks → ingressos → eventos
        db.query('DELETE FROM pedidos    WHERE evento_id = ?', [eventId], () => {
        db.query('DELETE FROM favoritos  WHERE evento_id = ?', [eventId], () => {
        db.query('DELETE FROM feedbacks  WHERE evento_id = ?', [eventId], () => {
        db.query('DELETE FROM ingressos  WHERE evento_id = ?', [eventId], () => {
        db.query('DELETE FROM eventos    WHERE id         = ?', [eventId], errFinal => {
          if (errFinal) {
            console.error('Falha ao deletar evento:', errFinal);
            // mesmo com erro, redireciona para o dashboard
          }
          res.redirect('/user/dashboard/producer');
        });});});});});
      }
    );
  };

exports.showEventFeedbacks = (req, res) => {
  const userId  = req.session.usuario.id;
  const eventId = parseInt(req.params.eventId, 10);

  // 1) Verifica propriedade do evento
  const verifySql = `
    SELECT 1
    FROM eventos
    WHERE id = ? AND usuario_id = ?
  `;
  db.query(verifySql, [eventId, userId], (err, rows) => {
    if (err || rows.length === 0) {
      console.error('Evento não pertence ao produtor ou não existe:', err);
      return res.status(404).send('Evento não encontrado');
    }

    // 2) Busca feedbacks sem data
    const sql = `
      SELECT 
        f.nota,
        f.comentario,
        u.nome AS comprador
      FROM feedbacks f
      JOIN usuarios u ON f.usuario_id = u.id
      WHERE f.evento_id = ?
      ORDER BY f.id DESC
    `;
    db.query(sql, [eventId], (err2, feedbacks) => {
      if (err2) {
        console.error('Erro ao buscar feedbacks:', err2);
        feedbacks = [];
      }
      res.render('user/dashboard/producerFeedbacks', {
        title:     'Feedbacks do Evento',
        feedbacks
      });
    });
  });
};