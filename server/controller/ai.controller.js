import Post from '../model/post.model.js';
import { improveContentWithAI } from '../services/openrouter.service.js';

// POST /api/ai/improve/:id
export const improvePost = async (req, res) => {
  try {
    const postId = req.params.id || req.body.postId;

    if (!postId) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    const originalPost = await Post.findById(postId);

    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (originalPost.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only improve your own posts' });
    }

    // Get AI-improved content
    const improvedData = await improveContentWithAI({
      title: originalPost.title,
      description: originalPost.description,
      content: originalPost.content,
      category: originalPost.category
    });

    // Save as a new draft
    const newDraft = await Post.create({
      title: improvedData.title,
      description: improvedData.description,
      content: improvedData.content,
      category: improvedData.category,
      image: originalPost.image || '',
      imagePublicId: originalPost.imagePublicId || '',
      createdBy: req.user._id,
      status: 'draft',
      versionType: 'ai_improved',
      improvedFrom: originalPost._id
    });

    res.status(201).json({
      success: true,
      message: 'AI-improved draft created',
      data: { originalPostId: originalPost._id, draft: newDraft }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { improvePost };
