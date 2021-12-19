import Blog from '../models/blogModel';
import Category from '../models/categoryModel';
import User from '../models/userModel';
import fs from 'fs';
const _ = require('lodash');
const stripHtml = require('string-strip-html');
const { smartTrim } = require('../helpers/blogHelpers');
const { errorHandler } = require('../helpers/dbErrorHandler');
const formidable = require('formidable');
import slugify from 'slugify';

export const createBlog = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not upload',
      });
    }

    const { title, body, categories } = fields;

    if (!title || !title.length) {
      return res.status(400).json({
        error: 'title is required',
      });
    }

    if (!body || body.length < 200) {
      return res.status(400).json({
        error: 'Content body is too short',
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        error: 'At least one category is required',
      });
    }

    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.excerpt = smartTrim(body, 220, ' ', ' ...');
    blog.slug = slugify(title).toLowerCase();
    blog.mtitle = `${title} | ${process.env.APP_NAME}`;
    blog.mdesc = body.substring(0, 160);
    blog.postedBy = req.user._id;
    let arrayOfCategories = categories && categories.split(',');

    if (files.image) {
      if (files.image.size > 10000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        });
      }
      blog.image.data = fs.readFileSync(files.image.path);
      blog.image.contentType = files.image.type;
    }

    blog.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }

      Blog.findByIdAndUpdate(
        result._id,
        { $push: { categories: arrayOfCategories } },
        { new: true },
      ).exec((err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        } else {
          res.json(result);
        }
      });
    });
  });
};

export const listBlogs = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  Blog.find({ published: true })
    .populate('categories', '_id name slug')
    .populate('postedBy', '_id name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      '_id title slug excerpt categories  postedBy username createdAt updatedAt',
    )
    .exec((err, blogs) => {
      if (err) {
        return res.status(400).json({
          error: 'blogs not found',
        });
      }
      res.send({ blogs });
    });
};

// Get list of all blogs and categories  help implement load more function
export const listAllBlogsCategories = async (req, res) => {
  try {
    let limit = req.body.limit ? parseInt(req.body.limit) : 10;
    let skip = req.body.skip ? parseInt(req.body.skip) : 0;
    const blogs = await Blog.find({ published: true })
      .populate('categories', '_id name slug')
      .populate('postedBy', '_id name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title slug excerpt categories  postedBy createdAt updatedAt')
      .exec();
    if (!blogs) return res.status(400).send('blogs not found');

    const categories = await Category.find({}).exec();
    if (!categories) return res.status(400).send({error:'Categories not found'});

    res.send({ blogs });
  } catch (err) {
    console.log(err);
    return res.status(400).send({error:'Can not fetch blog data'});
  }
};


// Get Single Blog
export const getSingleBlog = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOne({ slug, published: true })
      .populate('categories', '_id name slug')
      .populate('postedBy', '_id name')
      .select(
        '_id title body mtitle slug categories  postedBy createdAt updateAt ',
      )
      .exec();
    if (!blog) return res.status(400).send({ error: 'blog not found' });
    res.send({ blog });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

// Get Single unpublish Blog
export const getSingleUnplishBlog = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOne({ slug, published: { $ne: true } })
      .populate('categories', '_id name slug')
      .populate('postedBy', '_id name')
      .select(
        '_id title body mtitle slug categories  postedBy createdAt updateAt',
      )
      .exec();
    if (!blog) return res.status(400).send('blog not found');
    res.json(blog);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

// Get Single publish Blog
export const getSinglepublishBlog = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOne({ slug, published: { $ne: false } })
      .populate('categories', '_id name slug')
      .populate('postedBy', '_id name')
      .select(
        '_id title body mtitle slug categories  postedBy createdAt updateAt',
      )
      .exec();
    if (!blog) return res.status(400).send('blog not found');
    res.json(blog);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};


// get blog image
export const getImage = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blogdata = await Blog.findOne({ slug }).select('image').exec();
    if (!blogdata) return res.status(400).send({error:'image not found'});
    res.set('Content-Type', blogdata.image.contentType);
    res.send(blogdata.image.data);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
  // const slug = req.params.slug.toLowerCase();
  // Blog.findOne({ slug })
  //   .select('image')
  //   .exec((err, blog) => {
  //     if (err || !blog) {
  //       return res.status(400).json({
  //         error: errorHandler(err),
  //       });
  //     }
  //     res.set('Content-Type', blog.image.contentType);
  //     return res.send(blog.image.data);
  //   });
};

export const updateBlog = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    let blog = await Blog.findOne({ slug }).select('-image').exec();
    if (!blog) return res.status(400).send('blog not found');
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
      if (err) return res.status(400).json({ error: 'Image could not upload' });
      let slugBeforeMerge = blog.slug;
      blog = _.merge(blog, fields);
      blog.slug = slugBeforeMerge;
      const { body, mdesc, categories, tags } = fields;
      if (body) {
        blog.excerpt = smartTrim(body, 320, ' ', ' ...');
        blog.mdesc = body.substring(0, 160);
      }
      if (categories) {
        blog.categories = categories.split(',');
      }

      if (tags) {
        blog.tags = tags.split(',');
      }
      if (files.image) {
        if (files.image.size > 10000000) {
          return res.status(400).json({
            error: 'Image should be less then 1mb in size',
          });
        }
        blog.image.data = fs.readFileSync(files.image.path);
        blog.image.contentType = files.image.type;
      }
      blog.save();
      res.json(blog);
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

// Delete Blog
export const deleteBlog = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOneAndRemove({ slug }).exec();
    if (!blog) return res.status(400).send('blog not found');
    res.status(200).json({ ok: 'Blog deleted Successfully' });
  } catch (err) {
    console.log(err);
  }
};

/** 
export const listRelated = async (req, res) => {
  try {
    let limit = req.body.limit ? parseInt(req.body.limit) : 3;
    const { _id, categories } = req.body.blog;
    const blogs = await Blog.find({
      _id: { $ne: _id },
      categories: { $in: categories },
    })
      .limit(limit)
      .populate('postedBy', '_id name')
      .sort({ createdAt: -1 })
      .select('title slug excerpt postedBy createdAt updatedAt')
      .exec();
    console.log(req.body.blog);
    if (!blogs) return res.status(400).send({error:'Blog not found'});
    res.json(blogs);
  } catch (err) {
    console.log(err);
  }
};

*/

export const publishBlog = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOne({ slug }).exec();
    if (!blog) return res.status(400).send('Blog not found');
    const updated = await Blog.findOneAndUpdate(
      { slug },
      { published: true },
      { new: true },
    ).exec();
    if (!updated) return res.status(400).send({error:'Can not update blog'});
    res.send({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send({error:'Publish blog failed'});
  }
};

export const unpublishBlog = async (req, res) => {
  try {
    let slug = req.params.slug.toLowerCase();
    const blog = await Blog.findOne({ slug }).exec();
    if (!blog) return res.status(400).send('Blog not found');
    const updated = await Blog.findOneAndUpdate(
      { slug },
      { published: false },
      { new: true },
    ).exec();
    if (!updated) return res.status(400).send({error:'Can not update blog'});
    res.send({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const listPublishBlogs = async (req, res) => {
  try {
    const data = await Blog.find({ published: true })
      .populate('postedBy', '_id name')
      .sort({ createdAt: -1 })
      .select('_id title excerpt slug postedBy published createdAt updatedAt ');
    if (!data) return res.status(400).send({error:'Can not find data'});
    res.json(data);
  } catch (err) {
    console.log(err);
    return res.status(400).send({error:'Can not fetch blog data'});
  }
};

export const listUnpublishBlogs = async (req, res) => {
  try {
    const data = await Blog.find({ published: false })
      .populate('postedBy', '_id name')
      .sort({ createdAt: -1 })
      .select('_id title excerpt slug postedBy published createdAt updatedAt');
    if (!data) return res.status(400).send({error:'Can not find data'});
    res.json(data);
  } catch (err) {
    console.log(err);
    return res.status(400).send({error:'Can not fetch blog data'});
  }
};

export const listBlogsByUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).exec();
    if (!user) return res.status(400).send({error:'User not found'});

    let userId = user._id;
    const blogs = await Blog.find({ postedBy: userId, published: true })
      .populate('categories', '_id name slug')
      .populate('postedBy', '_id name ')
      .sort({ createdAt: -1 })
      .select(
        '_id published title slug postedBy categories createdAt updatedAt  ',
      )
      .exec();
    if (!blogs) return res.status(400).send({error: 'User blogs not found'});
    res.json(blogs);
  } catch (err) {
    console.log(err);
    return res.status(400).send({error:'User blog not found'});
  }
};
