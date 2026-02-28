const jwt = require('jsonwebtoken');
const SECRET = "SUPER_SECRET_KEY";

function authenticate(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch {
        res.sendStatus(403);
    }
}

function authorize(roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.sendStatus(403);
        }
        next();
    };
}

module.exports = { authenticate, authorize, SECRET };