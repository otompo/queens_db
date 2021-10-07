import User from '../models/userModel';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/authHelpers';
import shortId from 'shortid';
import { generateToken } from '../middlewares';

export const register = (req, res) => {
  // console.log("req.body", req.body);
  const { name, email, password } = req.body;

  let username = shortId.generate();
  const user = new User({ username, name, email, password });

  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        // error: errorHandler(err)
        error: 'Email is taken',
      });
    }
    // user.salt = undefined;
    // user.hashed_password = undefined;
    res.json({
      user,
    });
  });
};


export const login = (req, res) => {
  const { email, password } = req.body;
  // check if user exist
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please signup',
      });
    }
    // authenticate
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Email and password do not match',
      });
    }

    // generate a token and send to client
    /**  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });*/
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie('token', token, { expire: new Date() + 9999 });
    const { _id, name, email, role, username } = user;

    return res.json({
      token,
      user: { _id, name, email, role, username },
    });
  });
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.json({ message: 'Signout success' });
  } catch (err) {
    console.log(err);
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').exec();

    // console.log("CURRENT_USER", user);
    return res.json(user);
    // return res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send({error:'Please login is required'});
  }
};

export const makeUserAdmin = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username }).exec();
    if (!user) return res.status(400).send('User not found');
    const roleUpdated = await User.findOneAndUpdate(
      { username },
      {
        $addToSet: { role: 'Admin' },
      },
      { new: true },
    ).exec();
    res.send({message:`${user.name}  is now an Admin `});
    // console.log(roleUpdated);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const removeAsAdmin = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username }).exec();
    if (!user) return res.status(400).send('User not found');
    const roleUpdated = await User.findOneAndUpdate(
      { username },
      {
        $pull: { role: 'Admin' },
      },
      { new: true },
    ).exec();
    res.send({message:`${user.name}  is remove as an Admin `});
    // console.log(roleUpdated);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'Admin' })
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
    res.json({ total: users.length, users });
    if (!users) return res.status(400).send({error:'Users not found'});
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const getMembersUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'Member' })
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
    res.json({ total: users.length, users });
    if (!users) return res.status(400).send({error:'Users not found'});
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const getUserPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username })
      .select('-password -role -username -hashed_password -salt')
      .exec();
    if (!user) return res.status(400).send({error:'User not found'});
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const getUserProfile = async (req, res) => {
  try {
    // const userId = req.params;
    const user = await User.findById(req.params.userId).exec();
    if (!user) return res.status(400).send({error:'User not found'});
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    let { name, email, username } = req.body;

    let userExist = await User.findOne({ email }).exec();
    if (userExist) return res.status(400).send({error:'Email is taken '});

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(400).send({error:'User not found'});
    // hash password

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.username = username || user.username;
    }

    // console.log(user);
    const updatedUser = await user.save();
    res.send({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(404)
        .send('password is required and should be min 6 characters long');
    }

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(400).send('User not found');
    // hash password

    let hashedPassword = await hashPassword(newPassword);
    const userupdated = await User.findOneAndUpdate(
      {
        user,
      },
      {
        password: hashedPassword,
      },
    ).exec();
    // if (!userupdated) return res.status(400).send({error:'Can not update user'});
    res.send({ Ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};


export const userstats = async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: '$createdAt' },
        },
      },
      {
        $group: {
          _id: '$month',
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};
