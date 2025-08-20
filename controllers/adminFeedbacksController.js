// controllers/adminFeedbacksController.js
const db = require('../config/db');

exports.list = (req, res) => {
  const sql = `
    SELECT 
      f.id,
      f.nota,
      f.comentario,
      u.nome    AS usuario,
      e.titulo  AS evento
    FROM feedbacks f
    JOIN usuarios u ON f.usuario_id = u.id
    JOIN eventos  e ON f.evento_id   = e.id
    ORDER BY f.id DESC
  `;
  db.query(sql, (err, rows = []) => {
    if (err) {
      console.error('Erro ao listar feedbacks:', err);
      rows = [];
    }
    res.render('admin/feedbacks', {
      title:     'Gerenciar Feedbacks',
      admin:     req.session.admin,
      feedbacks: rows
    });
  });
};

// Mostra detalhe de um feedback específico
exports.showDetail = (req, res) => {
  const id = +req.params.id;
  const sql = `
    SELECT 
      f.id,
      f.nota,
      f.comentario,
      u.nome   AS usuario,
      u.email  AS email,
      e.id     AS evento_id,
      e.titulo AS evento
    FROM feedbacks f
    JOIN usuarios u ON f.usuario_id = u.id
    JOIN eventos  e ON f.evento_id   = e.id
    WHERE f.id = ?
  `;
  db.query(sql, [id], (err, rows = []) => {
    if (err || rows.length === 0) {
      console.error('Feedback não encontrado:', err);
      return res.redirect('/admin/feedbacks');
    }
    res.render('admin/feedbackDetail', {
      title: `Feedback #${id}`,
      admin: req.session.admin,
      fb:    rows[0]
    });
  });
};

// Exclui um feedback
exports.delete = (req, res) => {
  const id = +req.params.id;
  db.query('DELETE FROM feedbacks WHERE id = ?', [id], err => {
    if (err) console.error('Erro ao excluir feedback:', err);
    res.redirect('/admin/feedbacks');
  });
};

