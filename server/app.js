const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Create initial category folders
const createCategoryFolders = async () => {
  const categories = ['images', 'documents', 'videos', 'audio', 'archives', 'code', 'others'];
  const uploadsDir = path.join(__dirname, 'uploads');
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    
    for (const category of categories) {
      await fs.mkdir(path.join(uploadsDir, category), { recursive: true });
    }
    console.log('Category folders created successfully');
  } catch (error) {
    console.error('Error creating category folders:', error);
  }
};

createCategoryFolders();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 