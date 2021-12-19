import express from 'express';
import { adminMiddleware, isAuth } from './../middlewares/index';
import {
  createBlog,
  listBlogs,
  listBlogsByUser,
  getSingleBlog,
  deleteBlog,
  updateBlog,
  getImage,
  listPublishBlogs,
  listUnpublishBlogs,
  listAllBlogsCategories,
  publishBlog,
  unpublishBlog,
  getSingleUnplishBlog,
  getSinglepublishBlog
} from './../controllers/blogController';

const router = express.Router();

router.route('/blog').post(isAuth, createBlog);

router.route('/blogs').get(listBlogs);
router.route('/blogs/list-blogs-categories').post(listAllBlogsCategories);
router.route('/blog/:slug').get(getSingleBlog);
router
  .route('/blog/unpublish/:slug')
  .get(isAuth, adminMiddleware, getSingleUnplishBlog);
router
  .route('/blog/publish/:slug')
  .get(isAuth, adminMiddleware, getSinglepublishBlog);

router.route('/blog/:slug').delete(isAuth, adminMiddleware, deleteBlog);
router.route('/blog/:slug').put(isAuth, adminMiddleware, updateBlog);
router.route('/blog/img/:slug').get(getImage);
router
  .route('/blogs/listpublished')
  .get(isAuth, adminMiddleware, listPublishBlogs);
router
  .route('/blogs/listunpublished')
  .get(isAuth, adminMiddleware, listUnpublishBlogs);
// router.route('/blog/related').post(listRelated);
// router.route('/blogs/search').get(listSearch);

// this Auth user blog crud
// router.route('/user/blog').post( authMiddleware, createBlog);
router.route('/:userId/blogs').get(listBlogsByUser);

// router
//   .route('/user/blog/:slug')
//   .delete( authMiddleware, canUpdateDeleteBlog, removeBlog);

// router
//   .route('/user/blog/:slug')
//   .put( authMiddleware, canUpdateDeleteBlog, updateBlog);

router.route('/blog/publish/:slug').put(isAuth, adminMiddleware, publishBlog);

router
  .route('/blog/unpublish/:slug')
  .put(isAuth, adminMiddleware, unpublishBlog);

module.exports = router;
