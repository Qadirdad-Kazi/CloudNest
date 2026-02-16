import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Suggestion from '../models/Suggestion.js';
import User from '../models/User.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    next();
  } catch (error) {
    console.error('Error in admin authorization:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
};

// Submit a new suggestion
router.post('/suggestions', async (req, res) => {
  try {
    const { title, suggestion } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!title || !suggestion) {
      return res.status(400).json({ message: 'Title and suggestion are required' });
    }

    // Create new suggestion
    const newSuggestion = new Suggestion({
      userId,
      title,
      suggestion
    });

    // Save to database
    await newSuggestion.save();

    console.log(`New suggestion submitted by user ${userId}: ${title}`);
    res.status(201).json({ 
      message: 'Suggestion submitted successfully',
      suggestion: {
        id: newSuggestion._id,
        title: newSuggestion.title,
        status: newSuggestion.status,
        createdAt: newSuggestion.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({ message: 'Failed to submit suggestion' });
  }
});

// Get all suggestions for the current user
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all suggestions for this user
    const suggestions = await Suggestion.find({ userId })
      .sort({ createdAt: -1 });
    
    // Format the response
    const formattedSuggestions = suggestions.map(suggestion => ({
      id: suggestion._id,
      title: suggestion.title,
      suggestion: suggestion.suggestion,
      status: suggestion.status,
      adminResponse: suggestion.adminResponse,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt
    }));
    
    res.json(formattedSuggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
});

// Get a specific suggestion
router.get('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the suggestion
    const suggestion = await Suggestion.findOne({ _id: id, userId });
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    res.json({
      id: suggestion._id,
      title: suggestion.title,
      suggestion: suggestion.suggestion,
      status: suggestion.status,
      adminResponse: suggestion.adminResponse,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt
    });
  } catch (error) {
    console.error('Error getting suggestion:', error);
    res.status(500).json({ message: 'Failed to get suggestion' });
  }
});

// Delete a suggestion
router.delete('/suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find and delete the suggestion
    const suggestion = await Suggestion.findOneAndDelete({ _id: id, userId });
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    res.json({ message: 'Suggestion deleted successfully', id });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ message: 'Failed to delete suggestion' });
  }
});

// ADMIN ROUTES

// Get all suggestions (admin only)
router.get('/admin/suggestions', isAdmin, async (req, res) => {
  try {
    // Get all suggestions with user information
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    
    // Get user information for each suggestion
    const populatedSuggestions = await Promise.all(suggestions.map(async (suggestion) => {
      const user = await User.findById(suggestion.userId, 'name email');
      return {
        id: suggestion._id,
        title: suggestion.title,
        suggestion: suggestion.suggestion,
        status: suggestion.status,
        adminResponse: suggestion.adminResponse,
        createdAt: suggestion.createdAt,
        updatedAt: suggestion.updatedAt,
        userName: user?.name || null,
        userEmail: user?.email || null
      };
    }));
    
    res.json(populatedSuggestions);
  } catch (error) {
    console.error('Error getting all suggestions:', error);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
});

// Update a suggestion status and response (admin only)
router.patch('/admin/suggestions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    
    // Validate input
    if (!status || !['pending', 'reviewed', 'implemented', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find and update the suggestion
    const suggestion = await Suggestion.findById(id);
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    suggestion.status = status;
    suggestion.adminResponse = adminResponse || '';
    suggestion.updatedAt = Date.now();
    
    await suggestion.save();
    
    res.json({
      id: suggestion._id,
      title: suggestion.title,
      suggestion: suggestion.suggestion,
      status: suggestion.status,
      adminResponse: suggestion.adminResponse,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt
    });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ message: 'Failed to update suggestion' });
  }
});

// Delete a suggestion (admin override)
router.delete('/admin/suggestions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete the suggestion
    const suggestion = await Suggestion.findByIdAndDelete(id);
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    res.json({ message: 'Suggestion deleted successfully', id });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ message: 'Failed to delete suggestion' });
  }
});

export default router;
