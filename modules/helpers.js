exports.checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/log-in');
};

exports.checkRank = (rank) => {
  return function (req, res, next) {
    if (req.user.rank >= rank) {
      return next();
    }
    res.redirect('/');
  };
};
