import Post from '../model/post.model.js';

// GET /api/admin/posts/pending
export const getPendingPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ status: 'pending' })
        .populate('createdBy', 'name email role createdAt')
        .populate('improvedFrom', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      data: { posts, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/posts/approve/:id
export const approvePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Post is already approved' });
    }
    if (post.status === 'draft') {
      return res.status(400).json({ success: false, message: 'Post must be submitted before approving' });
    }

    post.status = 'approved';
    post.rejectionReason = '';
    await post.save();
    await post.populate('createdBy', 'name email role');

    res.status(200).json({ success: true, message: 'Post approved', data: { post } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/posts/reject/:id
export const rejectPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.status === 'draft') {
      return res.status(400).json({ success: false, message: 'Post must be submitted before rejecting' });
    }
    if (post.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Post is already rejected' });
    }

    post.status = 'rejected';
    post.rejectionReason = req.body.rejectionReason || 'Does not meet publication guidelines';
    await post.save();
    await post.populate('createdBy', 'name email role');

    res.status(200).json({ success: true, message: 'Post rejected', data: { post } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getPendingPosts, approvePost, rejectPost };
