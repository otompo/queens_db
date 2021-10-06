import Category from '../models/categoryModel';
import slugify from 'slugify';
import Blog from '../models/blogModel';

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    let slug = slugify(name).toLowerCase();
    const alreadyExist = await Category.findOne({ slug }).exec();
    if (alreadyExist) return res.status(400).send('Category name exist');
    const category = await new Category({ name, slug }).save();
    res.json(category);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Category create failed. Try again.');
  }
};

export const getSingleCategory = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Category.findOne({ slug }).exec((err, category) => {
    if (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
    // res.json(category);
    Blog.find({ categories: category })
      .populate('categories', '_id name slug')
      .populate('postedBy', '_id name')
      .select('_id title slug excerpt categories postedBy createdAt updatedAt')
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json({ category: category, blogs: data });
      });
  });
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).exec();
    res.status(200).json({ total: categories.length, categories });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Categories not found. Try again.');
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const category = await Category.findOneAndRemove({ slug }).exec();
    if (!category) return res.status(400).send('Category not found');
    res.json({ message: 'Category Deleted Successfully' });
  } catch (err) {
    console.log(err);
  }
};
