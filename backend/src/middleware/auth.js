import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication middleware to verify JWT tokens
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
export const authenticate = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access denied. No token provided.' 
        });
      }
      
      // Extract token
      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access denied. Invalid token format.' 
        });
      }
      
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = decoded;
        
        // Check if role is allowed (if roles are specified)
        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Insufficient permissions.' 
          });
        }
        
        next();
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token.' 
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error.' 
      });
    }
  };
};

/**
 * Alternative authentication using API key
 */
export const authenticateApiKey = () => {
  return async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access denied. No API key provided.' 
        });
      }
      
      // In a real app, you would validate the API key against a database
      // For now, we'll just check against an environment variable
      if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access denied. Invalid API key.' 
        });
      }
      
      // For API key auth, we'll set a default user with admin role
      req.user = {
        id: 'api',
        role: 'admin',
        name: 'API Client'
      };
      
      next();
    } catch (error) {
      console.error('API Key auth middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error.' 
      });
    }
  };
};
