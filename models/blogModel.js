import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;
const blogScheme = new Schema(
  {
    title: {
      type: String,
      trim: true,
      min: 3,
      max: 160,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
    body: {
      type: {},
      trim: true,
      required: true,
      min: 200,
      max: 2000000,
    },
    excerpt: {
      type: String,
      max: 1000,
    },
    mtitle: {
      type: String,
    },
    mdesc: {
      type: String,
    },
    image: {
      data: Buffer,
      ContentType: String,
    },
    categories: [{ type: ObjectId, ref: 'Category', required: true }],
    postedBy: {
      type: ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Blog', blogScheme);
