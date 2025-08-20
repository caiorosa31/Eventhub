const db = require('../config/db');

exports.listCategories = (req, res) => {
  const sql = `
    SELECT c.id, c.nome,
           COUNT(e.id) AS totalEventos
      FROM categorias c
 LEFT JOIN eventos e ON e.categoria_id = c.id
  GROUP BY c.id, c.nome
  ORDER BY c.nome
  `;
  db.query(sql, (err, rows = []) => {
    if (err) {
      console.error('Erro ao listar categorias:', err);
      rows = [];
    }
    res.render('admin/categories', {
      title:      'Gerenciar Categorias',
      admin:      req.session.admin,
      categories: rows
    });
  });
};

exports.showNewForm = (req, res) => {
  res.render('admin/newCategory', {
    title: 'Nova Categoria',
    admin: req.session.admin,
    error: null
  });
};

exports.createCategory = (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.render('admin/newCategory', {
      title: 'Nova Categoria',
      admin: req.session.admin,
      error: 'Informe um nome válido'
    });
  }
  db.query(
    'INSERT INTO categorias (nome) VALUES (?)',
    [nome.trim()],
    err => {
      if (err) {
        console.error('Erro ao criar categoria:', err);
        return res.render('admin/newCategory', {
          title: 'Nova Categoria',
          admin: req.session.admin,
          error: 'Falha ao criar. Talvez já exista.'
        });
      }
      res.redirect('/admin/categories');
    }
  );
};

exports.showCategoryEvents = (req, res) => {
  const catId = +req.params.id;
  // 1) busca nome da categoria
  db.query(
    'SELECT nome FROM categorias WHERE id = ?',
    [catId],
    (e1, catRows = []) => {
      if (e1 || !catRows.length) {
        console.error('Categoria não encontrada:', e1);
        return res.redirect('/admin/categories');
      }
      const categoria = catRows[0].nome;
      // 2) busca eventos dessa categoria
      db.query(
        `SELECT id, titulo, data_hora AS dataHora, local
           FROM eventos
          WHERE categoria_id = ?
          ORDER BY data_hora DESC`,
        [catId],
        (e2, evRows = []) => {
          if (e2) {
            console.error('Erro ao buscar eventos da categoria:', e2);
            evRows = [];
          }
          res.render('admin/categoryEvents', {
            title:      `Eventos: ${categoria}`,
            admin:      req.session.admin,
            categoria,
            events:     evRows
          });
        }
      );
    }
  );
};

exports.createCategory = (req, res) => {
  const nome = (req.body.nome || '').trim();

  if (!nome) {
    return res.render('admin/newCategory', {
      title: 'Nova Categoria',
      admin: req.session.admin,
      error: 'Informe um nome válido'
    });
  }

  db.query(
    'INSERT INTO categorias (nome) VALUES (?)',
    [nome],
    (err) => {
      if (err) {
        console.error('Erro ao criar categoria:', err);
        return res.render('admin/newCategory', {
          title: 'Nova Categoria',
          admin: req.session.admin,
          error: 'Falha ao criar. Talvez já exista.'
        });
      }
      // se inseriu corretamente, volta para a lista de categorias
      res.redirect('/admin/categories');
    }
  );
};