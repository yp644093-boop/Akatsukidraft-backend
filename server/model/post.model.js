import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Post content is required']
    },
    image: {
      type: String,
      default: ''
    },
    imagePublicId: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user reference is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'approved', 'rejected'],
        message: 'Status must be one of: draft, pending, approved, rejected'
      },
      default: 'draft',
      index: true
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true
    },
    improvedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null
    },
    versionType: {
      type: String,
      enum: {
        values: ['original', 'ai_improved'],
        message: 'versionType must be "original" or "ai_improved"'
      },
      default: 'original'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for optimized queries
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ status: 1, category: 1, createdAt: -1 });
postSchema.index({ createdBy: 1, status: 1, createdAt: -1 });

// Text index for search functionality across title and content
postSchema.index({ title: 'text', content: 'text', description: 'text' });

export const Post = mongoose.model('Post', postSchema);
export default Post;
