// middleware/ensureLogin.js
module.exports = function ensureLoggedIn(req, res, next) {
  if (!req.session.usuario) {
    // guarda a URL original para redirecionar após login
    req.session.redirectAfterLogin = req.originalUrl;
    return res.redirect('/login');
  }
  next();
};
