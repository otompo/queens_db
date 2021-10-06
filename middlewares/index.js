import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET || 'somethingsecretone',
    {
      expiresIn: '1d',
    },
  );
};

export const requireSignin = expressJwt({
  // secret expiryDate
  getToken: (req, res) => req.cookies.token,
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
});

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
    jwt.verify(
      token,
      process.env.JWT_SECRET || 'somethingsecret',
      (err, decode) => {
        if (err) {
          res.status(401).send({ message: 'Invalid Token' });
        } else {
          req.user = decode;
          next();
        }
      },
    );
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};


// Admin Middleware
export const adminMiddleware = (req, res, next) => {
  User.findById({ _id: req.user._id }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found....',
      });
    }

    if (!user.role.includes('Admin')) {
      return res.status(400).json({
        error: 'Admin resource. Access denied.',
      });
    }

    req.role = user;
    next();
  });
};

/**
// Admin Middleware
export const adminMiddleware = async (req, res, next) => {
  // const user = await User.findById(req.user._id).exec();
  const user = await User.findById(req.user._id);

  if (!user.role.includes('Admin')) {
    return res.status(400).json({
      error: 'Admin resource. Access denied',
    });
  }
  next();
};
*/

// AuthUserMiddleware
export const authMiddleware = async (req, res, next) => {
  let username = req.params.username;
  const user = await User.findOne({ username }).exec();
  if (!user) {
    return res.status(400).json({
      error: 'User not found',
    });
  }
  req.profile = user;
  next();
};
