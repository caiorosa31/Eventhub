// controllers/generosController.js
const db = require('../config/db');

exports.index = (req, res) => {
  // extrai filtros da query
  const { categoria_id, type, idade, busca } = req.query;
  const filters = [];
  const params  = [];

  // sempre exibe apenas eventos futuros
  filters.push('e.data_hora > NOW()');

  // filtro por categoria
  if (categoria_id) {
    filters.push('e.categoria_id = ?');
    params.push(categoria_id);
  }
  // filtro por tipo (presencial/online)
  if (type) {
    filters.push('e.tipo = ?');
    params.push(type);
  }
  // filtro por idade (livre/18)
  if (idade) {
    filters.push('e.idade = ?');
    params.push(idade);
  }
  // filtro por busca no título ou descrição
  if (busca) {
    filters.push('(e.titulo LIKE ? OR e.descricao LIKE ?)');
    params.push(`%${busca}%`, `%${busca}%`);
  }

  // monta SQL de eventos, sempre incluindo o filtro de data
  let sqlEvents = `
    SELECT
      e.id,
      e.titulo,
      e.descricao,
      e.data_hora  AS dataHora,
      e.local,
      e.tipo,
      e.idade,
      e.imagem,
      c.nome       AS categoria
    FROM eventos e
    JOIN categorias c ON c.id = e.categoria_id
  `;
  if (filters.length) {
    sqlEvents += ' WHERE ' + filters.join(' AND ');
  }
  sqlEvents += ' ORDER BY e.data_hora ASC';

  // carrega categorias e eventos
  db.query('SELECT id, nome FROM categorias', (err, categories) => {
    if (err) {
      console.error('Erro ao carregar categorias:', err);
      categories = [];
    }
    db.query(sqlEvents, params, (err2, events) => {
      if (err2) {
        console.error('Erro ao carregar eventos:', err2);
        events = [];
      }
      res.render('generos/index', {
        title:       'Explorar Eventos',
        categories,           // lista de categorias
        events,               // lista de eventos filtrados
        query: req.query      // reaproveita valores no formulário
      });
    });
  });
};