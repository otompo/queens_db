import express from 'express';
import { login, register, logout } from '../controllers/authController';
import { userSignupValidator } from '../validators';
const router = express.Router();

router.route('/register').post(userSignupValidator, register);
router.route('/login').post(login);
router.route('/logout').get(logout);

module.exports = router;
