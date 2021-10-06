import express from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getSingleCategory,
} from '../controllers/categoryController';

import { isAuth, adminMiddleware } from './../middlewares/index';

const router = express.Router();

router.route('/category').post(isAuth, adminMiddleware, createCategory);

router.route('/categories').get(getCategories);
router.route('/category/:slug').get(getSingleCategory);
router.route('/category/:slug').delete(isAuth, adminMiddleware, deleteCategory);

module.exports = router;
