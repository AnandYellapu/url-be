const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Updated from `userId` to `id`
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
};

module.exports = authenticateToken;