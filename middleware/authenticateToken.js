const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(403).json({ message: 'Authentication token missing' });
  }

  const token = authHeader.split(' ')[1]; // Extract only the token, removing "Bearer"
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id || null;
    next();
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    return res.status(403).json({ message: 'Invalid or expired authentication token' });
  }
};

module.exports = authenticateToken;
