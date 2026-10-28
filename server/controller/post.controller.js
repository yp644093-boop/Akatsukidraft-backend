import Post from '../model/post.model.js';
import cloudinaryService from '../services/cloudinary.service.js';

// POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { title, description, content, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    let image = req.body.image || '';
    let imagePublicId = req.body.imagePublicId || '';

    if (req.file) {
      const result = await cloudinaryService.uploadImageToCloudinary(req.file.buffer);
      image = result.secureUrl;
      imagePublicId = result.publicId;
    }

    const initialStatus = status === 'pending' ? 'pending' : 'draft';

    const post = await Post.create({
      title, description: description || '', content,
      category: category || 'General', image, imagePublicId,
      createdBy: req.user._id, status: initialStatus, versionType: 'original'
    });

    await post.populate('createdBy', 'name email role');

    res.status(201).json({ success: true, message: 'Post created', data: { post } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/posts
export const getPublicPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search, sort } = req.query;

    const query = { status: 'approved' };

    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { content: regex }, { description: regex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'title_asc') sortOption = { title: 1 };
    else if (sort === 'title_desc') sortOption = { title: -1 };

    const [posts, total] = await Promise.all([
      Post.find(query).populate('createdBy', 'name').sort(sortOption).skip(skip).limit(limit).lean(),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: { posts, pagination: { total, page, limit, totalPages } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/posts/:id
export const getPublicPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('createdBy', 'name');

    if (!post || post.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/posts/my-posts
export const getMyPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.versionType) query.versionType = req.query.versionType;

    const [posts, total] = await Promise.all([
      Post.find(query).populate('improvedFrom', 'title').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: { posts, pagination: { total, page, limit, totalPages } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/posts/:id
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    if (req.file) {
      const result = await cloudinaryService.uploadImageToCloudinary(req.file.buffer);
      // Delete old image if exists
      if (post.imagePublicId) {
        cloudinaryService.deleteImageFromCloudinary(post.imagePublicId).catch(() => {});
      }
      post.image = result.secureUrl;
      post.imagePublicId = result.publicId;
    } else if (req.body.image !== undefined) {
      post.image = req.body.image;
    }

    const { title, description, content, category, status } = req.body;
    if (title !== undefined) post.title = title;
    if (description !== undefined) post.description = description;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;

    // If post was approved/rejected, editing moves it back to draft or pending
    if (['approved', 'rejected'].includes(post.status)) {
      post.status = status === 'pending' ? 'pending' : 'draft';
      post.rejectionReason = '';
    } else if (status) {
      post.status = status === 'pending' ? 'pending' : 'draft';
    }

    await post.save();
    await post.populate('createdBy', 'name email');

    res.status(200).json({ success: true, message: 'Post updated', data: { post } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/posts/:id/submit
export const submitPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (post.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Post is already approved' });
    }
    if (post.status === 'pending') {
      return res.status(400).json({ success: false, message: 'Post is already pending review' });
    }

    post.status = 'pending';
    post.rejectionReason = '';
    await post.save();

    res.status(200).json({ success: true, message: 'Post submitted for review', data: { post } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    if (post.imagePublicId) {
      cloudinaryService.deleteImageFromCloudinary(post.imagePublicId).catch(() => {});
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { createPost, getPublicPosts, getPublicPostById, getMyPosts, updatePost, submitPost, deletePost };
