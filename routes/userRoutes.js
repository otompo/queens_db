import express from 'express';
import {
  currentUser,
  updateProfile,
  removeAsAdmin,
  getAdminUsers,
  getMembersUsers,
  makeUserAdmin,
  getUserPublicProfile,
  getUserProfile,
  updateUserPassword,
  userstats,
} from '../controllers/authController';
import { userById } from '../controllers/user';
import { adminMiddleware, isAuth, requireSignin } from '../middlewares';
import { userSignupValidator } from '../validators';
const router = express.Router();

router.route('/current-user').get(isAuth, currentUser);
router.route('/userpublicprofile/:username').get(getUserPublicProfile);
router.route('/profile/:userId').get(isAuth, getUserProfile);
router.route('/profile/:username').put(isAuth, updateProfile);
router.route('/profile/password/:username').put(isAuth, updateUserPassword);

router.route('/make-user-admin/:username').put(adminMiddleware, makeUserAdmin);
router
  .route('/remove-user-admin/:username')
  .put(isAuth, adminMiddleware, removeAsAdmin);

router.route('/getadminusers').get(isAuth, adminMiddleware, getAdminUsers);
router.route('/getmembersusers').get(isAuth, adminMiddleware, getMembersUsers);

router.route('/stats').get(userstats);

// router.param('userId', userById);
module.exports = router;
