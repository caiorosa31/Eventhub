// controllers/adminEventsController.js
const db   = require('../config/db');

exports.list = (req, res) => {
  db.query(
    `SELECT e.id, e.titulo, e.data_hora AS dataHora, e.local, c.nome AS categoria
     FROM eventos e
     JOIN categorias c ON c.id = e.categoria_id
     ORDER BY e.data_hora DESC`,
    (err, events = []) => {
      if (err) {
        console.error('Erro ao listar eventos:', err);
      }
      res.render('admin/events', {
        title:  'Gerenciar Eventos',
        admin:  req.session.admin,
        events
      });
    }
  );
};

exports.showEditForm = (req, res) => {
  const id       = +req.params.id;
  const returnTo = req.query.returnTo || '/admin/events';

  db.query('SELECT * FROM eventos WHERE id = ?', [id], (err1, ev = []) => {
    if (err1 || ev.length === 0) {
      console.error('Evento não encontrado:', err1);
      return res.redirect(returnTo);
    }
    db.query('SELECT id, nome FROM categorias', (err2, cats = []) => {
      if (err2) console.error('Erro ao listar categorias:', err2);
      res.render('admin/editEvent', {
        title:      'Editar Evento',
        admin:      req.session.admin,
        event:      ev[0],
        categories: cats,
        error:      null,
        returnTo    // passa para a view
      });
    });
  });
};

exports.update = (req, res) => {
  const id       = +req.params.id;
  const { titulo, descricao, data_hora, local, categoria_id, tipo, idade, returnTo } = req.body;

  db.query(
    `UPDATE eventos
     SET titulo       = ?,
         descricao    = ?,
         data_hora    = ?,
         local        = ?,
         categoria_id = ?,
         tipo         = ?,
         idade        = ?
     WHERE id = ?`,
    [titulo, descricao, data_hora, local, categoria_id, tipo, idade, id],
    err => {
      if (err) {
        console.error('Erro ao atualizar evento:', err);
        return res.redirect('/admin/events');
      }
      // redireciona de volta para onde veio (detalhe do usuário)
      res.redirect(returnTo || '/admin/events');
    }
  );
};

exports.delete = (req, res) => {
  const id = +req.params.id;

  // limpar dependências...
  db.query('DELETE FROM favoritos WHERE evento_id = ?', [id], () => {
    db.query('DELETE FROM pedidos WHERE evento_id = ?', [id], () => {
      db.query('DELETE FROM ingressos WHERE evento_id = ?', [id], () => {
        db.query('DELETE FROM feedbacks WHERE evento_id = ?', [id], () => {
          // finalmente o evento
          db.query('DELETE FROM eventos WHERE id = ?', [id], errEvt => {
            if (errEvt) console.error('Erro ao excluir evento:', errEvt);
            // volta para quem chamou
            const back = req.get('referer') || '/admin/events';
            res.redirect(back);
          });
        });
      });
    });
  });
};
