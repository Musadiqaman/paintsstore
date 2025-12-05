// middleware/ensure2FA.js
export function ensure2FA(req, res, next) {
  if (!req.session.otpUserId) {
    return res.redirect("/auth/login");
  }
  next();
}
