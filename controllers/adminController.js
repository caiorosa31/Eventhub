// controllers/adminController.js
const db = require('../config/db');

/**
 * Middleware de proteção para rotas de admin
 */
exports.ensureLoggedIn = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  next();
};

/**
 * GET /admin/login
 */
exports.showLoginForm = (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: null
  });
};

/**
 * POST /admin/login
 */
exports.login = (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM admins WHERE username = ?', [username], (err, rows) => {
    if (err || rows.length === 0 || rows[0].password !== password) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Credenciais inválidas'
      });
    }
    req.session.admin = { id: rows[0].id, username: rows[0].username };
    res.redirect('/admin/dashboard');
  });
};

/**
 * GET /admin/logout
 */
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

/**
 * GET /admin/dashboard
 */
exports.showDashboard = (req, res) => {
  db.query('SELECT COUNT(*) AS totalUsuarios FROM usuarios', (e1, uRes=[]) => {
    db.query('SELECT COUNT(*) AS totalEventos FROM eventos', (e2, evRes=[]) => {
      db.query('SELECT COUNT(*) AS totalProdutores FROM produtores', (e3, pRes=[]) => {
        db.query('SELECT COUNT(*) AS totalPedidos FROM pedidos', (e4, peRes=[]) => {
          res.render('admin/dashboard', {
            title: 'Painel Admin',
            admin: req.session.admin,
            metrics: {
              usuarios:   uRes[0]?.totalUsuarios   || 0,
              eventos:    evRes[0]?.totalEventos    || 0,
              produtores: pRes[0]?.totalProdutores || 0,
              pedidos:    peRes[0]?.totalPedidos    || 0
            }
          });
        });
      });
    });
  });
};

/**
 * GET /admin/users
 */
exports.showUsers = (req, res) => {
  db.query('SELECT id, nome, email FROM usuarios ORDER BY id ASC', (err, users=[]) => {
    if (err) console.error('Erro ao listar usuários:', err);
    res.render('admin/users', {
      title: 'Gerenciar Usuários',
      admin: req.session.admin,
      users
    });
  });
};

/**
 * GET /admin/users/:id/edit
 */
exports.showEditUserForm = (req, res) => {
  const id = +req.params.id;
  db.query('SELECT id, nome, email FROM usuarios WHERE id = ?', [id], (err, rows=[]) => {
    if (err || rows.length === 0) {
      return res.redirect('/admin/users');
    }
    res.render('admin/editUser', {
      title: 'Editar Usuário',
      admin: req.session.admin,
      user:  rows[0]
    });
  });
};

/**
 * POST /admin/users/:id/edit
 */
exports.updateUser = (req, res) => {
  const id = +req.params.id;
  const { nome, email } = req.body;
  db.query('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?', [nome, email, id], err => {
    if (err) console.error('Erro ao atualizar usuário:', err);
    res.redirect('/admin/users');
  });
};

/**
 * POST /admin/users/:id/delete
 */
exports.deleteUser = (req, res) => {
  const userId = +req.params.id;

  // 1) Remove favoritos do usuário
  db.query('DELETE FROM favoritos WHERE usuario_id = ?', [userId], err1 => {
    if (err1) console.error('Erro ao limpar favoritos do usuário:', err1);

    // 2) Remove pedidos do usuário
    db.query('DELETE FROM pedidos WHERE usuario_id = ?', [userId], err2 => {
      if (err2) console.error('Erro ao limpar pedidos do usuário:', err2);

      // 3) Remove feedbacks feitos pelo usuário
      db.query('DELETE FROM feedbacks WHERE usuario_id = ?', [userId], err3 => {
        if (err3) console.error('Erro ao limpar feedbacks do usuário:', err3);

        // 4) Busca todos os eventos criados pelo produtor (se houver)
        db.query('SELECT id FROM eventos WHERE usuario_id = ?', [userId], (err4, rows) => {
          if (err4) console.error('Erro ao listar eventos do produtor:', err4);
          const eventIds = rows.map(r => r.id);

          // Função recursiva para remover cada evento em cascata
          const removeEventCascade = idx => {
            if (idx >= eventIds.length) {
              // Após limpar todos os eventos, remove produtor e usuário
              db.query('DELETE FROM produtores WHERE usuario_id = ?', [userId], errP => {
                if (errP) console.error('Erro ao remover cadastro de produtor:', errP);
                db.query('DELETE FROM usuarios WHERE id = ?', [userId], errU => {
                  if (errU) console.error('Erro ao deletar usuário:', errU);
                  return res.redirect('/admin/users');
                });
              });
              return;
            }
            const evId = eventIds[idx];
            db.query('DELETE FROM favoritos  WHERE evento_id = ?', [evId], () => {
              db.query('DELETE FROM pedidos     WHERE evento_id = ?', [evId], () => {
                db.query('DELETE FROM ingressos   WHERE evento_id = ?', [evId], () => {
                  db.query('DELETE FROM feedbacks   WHERE evento_id = ?', [evId], () => {
                    db.query('DELETE FROM eventos     WHERE id         = ?', [evId], () => {
                      removeEventCascade(idx + 1);
                    });
                  });
                });
              });
            });
          };

          // Inicia a remoção em cascata dos eventos
          removeEventCascade(0);
        });
      });
    });
  });
};

/**
 * GET /admin/users/:id
 */
exports.showUserDetails = (req, res) => {
  const userId = +req.params.id;

  // 1) Dados básicos do usuário
  db.query(
    'SELECT id, nome, email FROM usuarios WHERE id = ?',
    [userId],
    (err, uRows = []) => {
      if (err || uRows.length === 0) {
        console.error('Usuário não encontrado:', err);
        return res.redirect('/admin/users');
      }
      const user = uRows[0];

      // 2) Favoritos
      db.query(
        `SELECT e.id, e.titulo, e.data_hora AS dataHora
         FROM favoritos f
         JOIN eventos e ON f.evento_id = e.id
         WHERE f.usuario_id = ?
         ORDER BY f.id DESC`,
        [userId],
        (err2, favRows = []) => {
          if (err2) console.error('Erro ao buscar favoritos:', err2);

          // 3) Ingressos
          db.query(
            `SELECT p.id          AS pedido_id,
                    e.id          AS evento_id,
                    e.titulo,
                    p.quantidade,
                    p.data_pedido AS dataPedido
             FROM pedidos p
             JOIN eventos e ON p.evento_id = e.id
             WHERE p.usuario_id = ?
             ORDER BY p.data_pedido DESC`,
            [userId],
            (err3, ticketRows = []) => {
              if (err3) console.error('Erro ao buscar ingressos:', err3);

              // 4) Verifica se é produtor (colunas ajustadas)
              db.query(
                'SELECT id, cpf, banco, agencia, conta, endereco FROM produtores WHERE usuario_id = ?',
                [userId],
                (err4, prodRows = []) => {
                  if (err4) console.error('Erro ao buscar produtor:', err4);

                  const producerInfo = prodRows[0] || null;
                  if (producerInfo) {
                    // 5) Eventos criados pelo produtor
                    db.query(
                      `SELECT id, titulo, data_hora AS dataHora, local, idade, imagem
                       FROM eventos
                       WHERE usuario_id = ?
                       ORDER BY data_hora DESC`,
                      [userId],
                      (err5, evRows = []) => {
                        if (err5) console.error('Erro ao buscar eventos do produtor:', err5);

                        return res.render('admin/userDetail', {
                          title:        'Detalhes do Usuário',
                          admin:        req.session.admin,
                          user,
                          favorites:    favRows,
                          tickets:      ticketRows,
                          producerInfo,      // agora com banco, agencia, conta, endereco
                          myEvents:     evRows
                        });
                      }
                    );
                  } else {
                    // Usuário comum
                    return res.render('admin/userDetail', {
                      title:        'Detalhes do Usuário',
                      admin:        req.session.admin,
                      user,
                      favorites:    favRows,
                      tickets:      ticketRows,
                      producerInfo: null,
                      myEvents:     []
                    });
                  }
                }
              );
            }
          );
        }
      );
    }
  );
};