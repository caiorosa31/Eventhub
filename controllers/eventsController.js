// controllers/eventsController.js
const db = require('../config/db');

// GET /events/:id
// controllers/eventsController.js (ou onde estiver o showEvent)
exports.showEvent = (req, res) => {
  const eventId = parseInt(req.params.id, 10);

  // Buscamos o evento independente de data
  db.query(
    `SELECT e.*, c.nome AS categoria
     FROM eventos e
     JOIN categorias c ON c.id = e.categoria_id
     WHERE e.id = ?`,
    [eventId],
    (err, rows) => {
      if (err || rows.length === 0) {
        console.error('Erro ao buscar evento:', err);
        return res.status(404).send('Evento não encontrado');
      }
      const event   = rows[0];
      const expired = new Date(event.data_hora) <= new Date();

      // Buscar ingressos
      db.query(
        `SELECT id, nome, preco, quantidade
         FROM ingressos
         WHERE evento_id = ?`,
        [eventId],
        (err2, ticketsRaw) => {
          if (err2) {
            console.error('Erro ao buscar ingressos:', err2);
            ticketsRaw = [];
          }
          const tickets = ticketsRaw.map(t => ({
            id:         t.id,
            nome:       t.nome,
            preco:      parseFloat(t.preco),
            quantidade: parseInt(t.quantidade, 10)
          }));

          // Checa favorito
          let isFav = false;
          const render = () => {
            res.render('events/show', {
              title:   event.titulo,
              busca:   req.query.busca || '',
              usuario: req.session.usuario,
              event,
              tickets,
              isFav,
              expired   // novo flag
            });
          };

          if (req.session.usuario) {
            db.query(
              `SELECT 1 
               FROM favoritos 
               WHERE usuario_id = ? AND evento_id = ?`,
              [req.session.usuario.id, eventId],
              (err3, favRows) => {
                if (!err3 && favRows.length > 0) isFav = true;
                render();
              }
            );
          } else {
            render();
          }
        }
      );
    }
  );
};

// POST /events/:id/favorite
exports.toggleFavorite = (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const userId  = req.session.usuario.id;

  db.query(
    'SELECT 1 FROM favoritos WHERE usuario_id = ? AND evento_id = ?',
    [userId, eventId],
    (err, rows) => {
      if (err) {
        console.error('Erro ao verificar favorito:', err);
        return res.redirect('back');
      }
      if (rows.length > 0) {
        db.query(
          'DELETE FROM favoritos WHERE usuario_id = ? AND evento_id = ?',
          [userId, eventId],
          () => res.redirect(`/events/${eventId}`)
        );
      } else {
        db.query(
          'INSERT INTO favoritos (usuario_id, evento_id) VALUES (?, ?)',
          [userId, eventId],
          () => res.redirect(`/events/${eventId}`)
        );
      }
    }
  );
};

// POST /events/:id/buy
exports.buyTicket = (req, res) => {
  const eventId    = parseInt(req.params.id, 10);
  const userId     = req.session.usuario.id;
  const ingressoId = parseInt(req.body.ingressoId, 10);
  const quantity   = parseInt(req.body.quantity, 10) || 1;

  if (!ingressoId || quantity < 1) {
    return res.status(400).json({ error: 'Selecione quantidade válida' });
  }

  db.query(
    'SELECT preco, quantidade AS disponivel FROM ingressos WHERE id = ? AND evento_id = ?',
    [ingressoId, eventId],
    (err, rows) => {
      if (err || rows.length === 0) {
        console.error('Erro ao buscar ingresso:', err);
        return res.status(500).json({ error: 'Não foi possível processar a compra' });
      }

      const preco      = parseFloat(rows[0].preco);
      const disponivel = parseInt(rows[0].disponivel, 10);
      const buyQty     = Math.min(quantity, disponivel);

      if (buyQty === 0) {
        return res.status(400).json({ error: 'Ingressos esgotados' });
      }

      const valor = preco * buyQty;

      db.query(
        `INSERT INTO pedidos
           (usuario_id, evento_id, ingresso_id, quantidade, valor, status)
         VALUES (?, ?, ?, ?, ?, 'confirmado')`,
        [userId, eventId, ingressoId, buyQty, valor],
        err2 => {
          if (err2) {
            console.error('Erro ao criar pedido:', err2);
            return res.status(500).json({ error: 'Falha ao criar pedido' });
          }
          db.query(
            'UPDATE ingressos SET quantidade = quantidade - ? WHERE id = ?',
            [buyQty, ingressoId],
            err3 => {
              if (err3) console.error('Erro ao atualizar estoque:', err3);
              // responde sucesso em JSON
              return res.json({ success: true });
            }
          );
        }
      );
    }
  );
};
