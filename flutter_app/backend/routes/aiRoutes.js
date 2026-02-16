import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { AIModel } from '../models/AIModel.js';
import { FileCategory } from '../models/FileCategory.js';
import { ImageMetadata } from '../models/ImageMetadata.js';
import { DuplicateFile } from '../models/DuplicateFile.js';
import { ContentIndex } from '../models/ContentIndex.js';
import { SmartSuggestion } from '../models/SmartSuggestion.js';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import User from '../models/User.js';
import crypto from 'crypto';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Smart File Organization
router.post('/organize-files', async (req, res) => {
  try {
    const userId = req.user._id;
    const { force = false } = req.body;

    // Get user's files
    const files = await File.find({ userId, isDeleted: false });
    
    // Categorize files using AI
    const categorizations = await categorizeFiles(userId, files, force);
    
    // Save categories
    const savedCategories = [];
    for (const categorization of categorizations) {
      const existingCategory = await FileCategory.findOne({
        userId,
        fileId: categorization.fileId
      });

      if (existingCategory && !force) {
        continue; // Skip if already categorized and not forcing
      }

      const category = await FileCategory.findOneAndUpdate(
        { userId, fileId: categorization.fileId },
        {
          category: categorization.category,
          subcategory: categorization.subcategory,
          confidence: categorization.confidence,
          autoCategorized: true,
          tags: categorization.tags,
          metadata: categorization.metadata,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      savedCategories.push(category);
    }

    res.json({
      message: 'Files organized successfully',
      categorized: savedCategories.length,
      categories: savedCategories
    });
  } catch (error) {
    console.error('File organization error:', error);
    res.status(500).json({ message: 'Failed to organize files', error: error.message });
  }
});

// Get file categories
router.get('/categories', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.query;

    const query = { userId };
    if (fileId) query.fileId = fileId;

    const categories = await FileCategory.find(query)
      .populate('fileId', 'name type size')
      .sort({ createdAt: -1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories', error: error.message });
  }
});

// Update file category manually
router.put('/categories/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    const { category, subcategory, tags } = req.body;

    const updatedCategory = await FileCategory.findOneAndUpdate(
      { userId, fileId },
      {
        category,
        subcategory,
        tags,
        manualOverride: true,
        autoCategorized: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category: updatedCategory });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
});

// Image Recognition
router.post('/analyze-image/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;

    // Check if file exists and is an image
    const file = await File.findOne({ _id: fileId, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!file.type.startsWith('image/')) {
      return res.status(400).json({ message: 'File is not an image' });
    }

    // Analyze image using AI
    const analysis = await analyzeImage(userId, file);
    
    // Save image metadata
    const metadata = await ImageMetadata.findOneAndUpdate(
      { userId, fileId },
      {
        ...analysis,
        processedAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Image analyzed successfully',
      metadata
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze image', error: error.message });
  }
});

// Get image metadata
router.get('/image-metadata/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;

    const metadata = await ImageMetadata.findOne({ userId, fileId })
      .populate('fileId', 'name type');

    if (!metadata) {
      return res.status(404).json({ message: 'Image metadata not found' });
    }

    res.json({ metadata });
  } catch (error) {
    console.error('Get image metadata error:', error);
    res.status(500).json({ message: 'Failed to get image metadata', error: error.message });
  }
});

// Search images by tags
router.get('/images/search', async (req, res) => {
  try {
    const userId = req.user._id;
    const { tags, objects, faces, minConfidence = 0.5 } = req.query;

    const query = { userId };
    
    if (tags) {
      query['tags.tag'] = { $in: tags.split(',') };
    }
    
    if (objects) {
      query['objects.label'] = { $in: objects.split(',') };
      query['objects.confidence'] = { $gte: parseFloat(minConfidence) };
    }
    
    if (faces) {
      query.faces = { $exists: true };
    }

    const imageMetadata = await ImageMetadata.find(query)
      .populate('fileId', 'name type size')
      .sort({ processedAt: -1 });

    res.json({ images: imageMetadata });
  } catch (error) {
    console.error('Search images error:', error);
    res.status(500).json({ message: 'Failed to search images', error: error.message });
  }
});

// Duplicate Detection
router.post('/detect-duplicates', async (req, res) => {
  try {
    const userId = req.user._id;
    const { algorithm = 'hybrid', threshold = 0.9 } = req.body;

    // Get user's files
    const files = await File.find({ userId, isDeleted: false });
    
    // Detect duplicates
    const duplicates = await detectDuplicates(userId, files, algorithm, threshold);
    
    // Save duplicate records
    const savedDuplicates = [];
    for (const duplicate of duplicates) {
      const existingDuplicate = await DuplicateFile.findOne({
        userId,
        originalFileId: duplicate.originalFileId,
        duplicateFileId: duplicate.duplicateFileId
      });

      if (existingDuplicate) {
        continue; // Skip if already detected
      }

      const duplicateRecord = new DuplicateFile({
        userId,
        ...duplicate
      });

      await duplicateRecord.save();
      savedDuplicates.push(duplicateRecord);
    }

    res.json({
      message: 'Duplicate detection completed',
      duplicates: savedDuplicates.length,
      results: savedDuplicates
    });
  } catch (error) {
    console.error('Duplicate detection error:', error);
    res.status(500).json({ message: 'Failed to detect duplicates', error: error.message });
  }
});

// Get duplicates
router.get('/duplicates', async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, algorithm } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (algorithm) query.algorithm = algorithm;

    const duplicates = await DuplicateFile.find(query)
      .populate('originalFileId', 'name type size')
      .populate('duplicateFileId', 'name type size')
      .sort({ similarity: -1 });

    res.json({ duplicates });
  } catch (error) {
    console.error('Get duplicates error:', error);
    res.status(500).json({ message: 'Failed to get duplicates', error: error.message });
  }
});

// Resolve duplicate
router.put('/duplicates/:duplicateId/resolve', async (req, res) => {
  try {
    const userId = req.user._id;
    const { duplicateId } = req.params;
    const { action, notes } = req.body;

    const duplicate = await DuplicateFile.findOneAndUpdate(
      { _id: duplicateId, userId },
      {
        action,
        notes,
        status: 'reviewed',
        reviewedBy: userId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!duplicate) {
      return res.status(404).json({ message: 'Duplicate not found' });
    }

    // Execute action if needed
    if (action === 'delete_duplicate') {
      await File.findByIdAndUpdate(duplicate.duplicateFileId, { isDeleted: true });
    }

    res.json({ message: 'Duplicate resolved successfully', duplicate });
  } catch (error) {
    console.error('Resolve duplicate error:', error);
    res.status(500).json({ message: 'Failed to resolve duplicate', error: error.message });
  }
});

// Content Search
router.post('/index-content/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;

    // Check if file exists and is indexable
    const file = await File.findOne({ _id: fileId, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const indexableTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'html', 'xml', 'json', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'];
    const fileType = file.type.split('/')[1].toLowerCase();
    
    if (!indexableTypes.includes(fileType)) {
      return res.status(400).json({ message: 'File type not supported for content indexing' });
    }

    // Index content
    const index = await indexContent(userId, file);
    
    // Save content index
    const contentIndex = await ContentIndex.findOneAndUpdate(
      { userId, fileId },
      {
        ...index,
        processingStatus: 'completed',
        indexedAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Content indexed successfully',
      index: contentIndex
    });
  } catch (error) {
    console.error('Content indexing error:', error);
    res.status(500).json({ message: 'Failed to index content', error: error.message });
  }
});

// Search content
router.post('/search-content', async (req, res) => {
  try {
    const userId = req.user._id;
    const { query, fileType, limit = 20 } = req.body;

    const searchQuery = {
      userId,
      $text: { $search: query }
    };

    if (fileType) {
      searchQuery.fileType = fileType;
    }

    const results = await ContentIndex.find(searchQuery)
      .populate('fileId', 'name type size')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    res.json({ results });
  } catch (error) {
    console.error('Content search error:', error);
    res.status(500).json({ message: 'Failed to search content', error: error.message });
  }
});

// Smart Suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, fileId, limit = 10 } = req.query;

    const query = { userId, isActive: true };
    
    if (type) query.suggestionType = type;
    if (fileId) query.sourceFileId = fileId;

    const suggestions = await SmartSuggestion.find(query)
      .populate('suggestedFileId', 'name type size')
      .sort({ score: -1 })
      .limit(parseInt(limit));

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
});

// Generate smart suggestions
router.post('/generate-suggestions', async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, fileId } = req.body;

    let suggestions = [];

    switch (type) {
      case 'related_files':
        suggestions = await generateRelatedFileSuggestions(userId, fileId);
        break;
      case 'recent_access':
        suggestions = await generateRecentAccessSuggestions(userId);
        break;
      case 'frequent_access':
        suggestions = await generateFrequentAccessSuggestions(userId);
        break;
      case 'collaborative':
        suggestions = await generateCollaborativeSuggestions(userId);
        break;
      case 'trending':
        suggestions = await generateTrendingSuggestions(userId);
        break;
      default:
        suggestions = await generatePersonalizedSuggestions(userId);
    }

    // Save suggestions
    const savedSuggestions = [];
    for (const suggestion of suggestions) {
      const existingSuggestion = await SmartSuggestion.findOne({
        userId,
        suggestedFileId: suggestion.suggestedFileId,
        suggestionType: type
      });

      if (existingSuggestion) {
        continue; // Skip if already exists
      }

      const suggestionRecord = new SmartSuggestion({
        userId,
        ...suggestion
      });

      await suggestionRecord.save();
      savedSuggestions.push(suggestionRecord);
    }

    res.json({
      message: 'Suggestions generated successfully',
      suggestions: savedSuggestions
    });
  } catch (error) {
    console.error('Generate suggestions error:', error);
    res.status(500).json({ message: 'Failed to generate suggestions', error: error.message });
  }
});

// Provide feedback on suggestion
router.put('/suggestions/:suggestionId/feedback', async (req, res) => {
  try {
    const userId = req.user._id;
    const { suggestionId } = req.params;
    const { action, feedback } = req.body;

    const suggestion = await SmartSuggestion.findOneAndUpdate(
      { _id: suggestionId, userId },
      {
        userAction: action,
        feedback,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    res.json({ message: 'Feedback recorded successfully', suggestion });
  } catch (error) {
    console.error('Suggestion feedback error:', error);
    res.status(500).json({ message: 'Failed to record feedback', error: error.message });
  }
});

// AI Helper Functions
async function categorizeFiles(userId, files, force = false) {
  const categorizations = [];

  for (const file of files) {
    // Skip if already categorized and not forcing
    if (!force) {
      const existingCategory = await FileCategory.findOne({ userId, fileId: file._id });
      if (existingCategory) continue;
    }

    // AI-based categorization logic
    const category = await categorizeFile(file);
    categorizations.push(category);
  }

  return categorizations;
}

async function categorizeFile(file) {
  const name = file.name.toLowerCase();
  const type = file.type;
  const size = file.size;

  // Simple rule-based categorization (in real implementation, use ML model)
  let category = 'other';
  let subcategory = null;
  let confidence = 0.5;
  let tags = [];

  // Image files
  if (type.startsWith('image/')) {
    category = 'images';
    confidence = 0.9;
    
    if (name.includes('screenshot')) {
      subcategory = 'screenshots';
      tags.push('screenshot');
    } else if (name.includes('photo')) {
      subcategory = 'photos';
      tags.push('photo');
    } else if (name.includes('selfie')) {
      subcategory = 'selfies';
      tags.push('selfie');
    }
  }
  
  // Document files
  else if (type.includes('pdf') || type.includes('doc') || type.includes('text')) {
    category = 'documents';
    confidence = 0.8;
    
    if (name.includes('invoice')) {
      subcategory = 'financial';
      tags.push('invoice', 'financial');
    } else if (name.includes('resume')) {
      subcategory = 'career';
      tags.push('resume', 'career');
    } else if (name.includes('contract')) {
      subcategory = 'legal';
      tags.push('contract', 'legal');
    }
  }
  
  // Video files
  else if (type.startsWith('video/')) {
    category = 'videos';
    confidence = 0.9;
    
    if (name.includes('tutorial')) {
      subcategory = 'educational';
      tags.push('tutorial', 'educational');
    } else if (name.includes('meeting')) {
      subcategory = 'meetings';
      tags.push('meeting');
    }
  }
  
  // Audio files
  else if (type.startsWith('audio/')) {
    category = 'audio';
    confidence = 0.8;
    
    if (name.includes('podcast')) {
      subcategory = 'podcasts';
      tags.push('podcast');
    } else if (name.includes('music')) {
      subcategory = 'music';
      tags.push('music');
    }
  }
  
  // Archive files
  else if (type.includes('zip') || type.includes('rar') || type.includes('7z')) {
    category = 'archives';
    confidence = 0.9;
    tags.push('compressed');
  }

  return {
    fileId: file._id,
    category,
    subcategory,
    confidence,
    tags,
    metadata: {
      fileSize: size,
      fileType: type,
      processedAt: new Date()
    }
  };
}

async function analyzeImage(userId, file) {
  // Mock image analysis (in real implementation, use computer vision API)
  return {
    width: 1920,
    height: 1080,
    format: 'JPEG',
    dominantColors: [
      { color: '#3B82F6', percentage: 0.3 },
      { color: '#10B981', percentage: 0.2 },
      { color: '#F59E0B', percentage: 0.15 }
    ],
    objects: [
      { label: 'person', confidence: 0.95, boundingBox: { x: 100, y: 100, width: 200, height: 300 } },
      { label: 'car', confidence: 0.87, boundingBox: { x: 400, y: 200, width: 300, height: 200 } }
    ],
    faces: [
      { boundingBox: { x: 120, y: 120, width: 60, height: 80 }, confidence: 0.92, age: '25-35', gender: 'female', expression: 'smile' }
    ],
    tags: [
      { tag: 'portrait', confidence: 0.88, source: 'ai' },
      { tag: 'outdoor', confidence: 0.75, source: 'ai' },
      { tag: 'daylight', confidence: 0.92, source: 'ai' }
    ],
    quality: {
      sharpness: 0.85,
      brightness: 0.7,
      contrast: 0.8,
      saturation: 0.75,
      noise: 0.1,
      blur: 0.05
    }
  };
}

async function detectDuplicates(userId, files, algorithm = 'hybrid', threshold = 0.9) {
  const duplicates = [];
  const fileHashes = new Map();

  for (const file of files) {
    const hash = generateFileHash(file, algorithm);
    
    if (fileHashes.has(hash)) {
      const originalFile = fileHashes.get(hash);
      const similarity = calculateSimilarity(file, originalFile);
      
      if (similarity >= threshold) {
        duplicates.push({
          originalFileId: originalFile._id,
          duplicateFileId: file._id,
          similarity,
          algorithm,
          hash,
          metadata: {
            originalSize: originalFile.size,
            duplicateSize: file.size,
            originalName: originalFile.name,
            duplicateName: file.name
          }
        });
      }
    } else {
      fileHashes.set(hash, file);
    }
  }

  return duplicates;
}

function generateFileHash(file, algorithm) {
  const content = `${file.name}-${file.size}-${file.type}`;
  
  switch (algorithm) {
    case 'hash':
      return crypto.createHash('md5').update(content).digest('hex');
    case 'content':
      return crypto.createHash('sha256').update(content).digest('hex');
    case 'visual':
      return crypto.createHash('md5').update(file.name).digest('hex');
    default:
      return crypto.createHash('sha256').update(content).digest('hex');
  }
}

function calculateSimilarity(file1, file2) {
  // Simple similarity calculation (in real implementation, use more sophisticated algorithms)
  const nameSimilarity = calculateStringSimilarity(file1.name, file2.name);
  const sizeSimilarity = 1 - Math.abs(file1.size - file2.size) / Math.max(file1.size, file2.size);
  const typeSimilarity = file1.type === file2.type ? 1 : 0;
  
  return (nameSimilarity * 0.3 + sizeSimilarity * 0.4 + typeSimilarity * 0.3);
}

function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function indexContent(userId, file) {
  // Mock content indexing (in real implementation, use text extraction libraries)
  return {
    fileType: file.type.split('/')[1],
    content: `Sample content from ${file.name}`,
    extractedText: `Extracted text from ${file.name}`,
    language: 'en',
    wordCount: 100,
    pages: 1,
    keywords: [
      { word: 'sample', frequency: 5, positions: [1, 10, 25, 50, 75], importance: 0.8 },
      { word: 'content', frequency: 3, positions: [2, 15, 40], importance: 0.9 }
    ],
    entities: [
      { text: 'CloudNest', type: 'ORGANIZATION', confidence: 0.95, position: 5 }
    ],
    topics: [
      { topic: 'technology', confidence: 0.85, keywords: ['sample', 'content'] }
    ],
    summary: `This is a summary of the content in ${file.name}`,
    processingStatus: 'completed'
  };
}

async function generateRelatedFileSuggestions(userId, fileId) {
  // Mock related file suggestions (in real implementation, use ML models)
  const suggestions = [];
  const relatedFiles = await File.find({ 
    userId, 
    isDeleted: false, 
    _id: { $ne: fileId } 
  }).limit(5);

  for (const file of relatedFiles) {
    suggestions.push({
      suggestionType: 'related_files',
      sourceFileId: fileId,
      suggestedFileId: file._id,
      score: Math.random() * 0.5 + 0.5,
      reason: 'Similar content or frequently accessed together',
      factors: {
        contentSimilarity: Math.random(),
        accessPattern: Math.random(),
        fileType: Math.random()
      }
    });
  }

  return suggestions;
}

async function generateRecentAccessSuggestions(userId) {
  // Mock recent access suggestions
  const suggestions = [];
  const recentFiles = await File.find({ 
    userId, 
    isDeleted: false 
  }).sort({ lastAccessedAt: -1 }).limit(5);

  for (const file of recentFiles) {
    suggestions.push({
      suggestionType: 'recent_access',
      suggestedFileId: file._id,
      score: Math.random() * 0.3 + 0.7,
      reason: 'Recently accessed file',
      factors: {
        recency: 1.0,
        frequency: Math.random()
      }
    });
  }

  return suggestions;
}

async function generateFrequentAccessSuggestions(userId) {
  // Mock frequent access suggestions
  const suggestions = [];
  const frequentFiles = await File.find({ 
    userId, 
    isDeleted: false 
  }).sort({ accessCount: -1 }).limit(5);

  for (const file of frequentFiles) {
    suggestions.push({
      suggestionType: 'frequent_access',
      suggestedFileId: file._id,
      score: Math.random() * 0.4 + 0.6,
      reason: 'Frequently accessed file',
      factors: {
        frequency: 1.0,
        recency: Math.random()
      }
    });
  }

  return suggestions;
}

async function generateCollaborativeSuggestions(userId) {
  // Mock collaborative suggestions
  const suggestions = [];
  const sharedFiles = await File.find({ 
    userId, 
    isDeleted: false,
    isShared: true 
  }).limit(5);

  for (const file of sharedFiles) {
    suggestions.push({
      suggestionType: 'collaborative',
      suggestedFileId: file._id,
      score: Math.random() * 0.3 + 0.7,
      reason: 'Shared file with collaboration potential',
      factors: {
        shareCount: file.shareCount,
        recentActivity: Math.random()
      }
    });
  }

  return suggestions;
}

async function generateTrendingSuggestions(userId) {
  // Mock trending suggestions
  const suggestions = [];
  const trendingFiles = await File.find({ 
    userId, 
    isDeleted: false 
  }).sort({ accessCount: -1, lastAccessedAt: -1 }).limit(5);

  for (const file of trendingFiles) {
    suggestions.push({
      suggestionType: 'trending',
      suggestedFileId: file._id,
      score: Math.random() * 0.4 + 0.6,
      reason: 'Trending file based on access patterns',
      factors: {
        trending: Math.random(),
        popularity: Math.random()
      }
    });
  }

  return suggestions;
}

async function generatePersonalizedSuggestions(userId) {
  // Mock personalized suggestions
  const suggestions = [];
  const allFiles = await File.find({ 
    userId, 
    isDeleted: false 
  }).limit(10);

  for (const file of allFiles) {
    suggestions.push({
      suggestionType: 'personalized',
      suggestedFileId: file._id,
      score: Math.random() * 0.5 + 0.5,
      reason: 'Personalized recommendation based on your usage patterns',
      factors: {
        personalization: Math.random(),
        context: Math.random(),
        preferences: Math.random()
      }
    });
  }

  return suggestions;
}

export default router;
