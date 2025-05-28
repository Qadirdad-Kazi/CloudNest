import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { promises as fs } from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/avatars');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
}).single('avatar');

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.toPublicJSON());
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone, address },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toPublicJSON());
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Update user avatar
export const updateAvatar = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Delete old avatar if exists
      const user = await User.findById(req.user._id);
      if (user.avatar) {
        const oldAvatarPath = path.join(uploadsDir, path.basename(user.avatar));
        await fs.unlink(oldAvatarPath).catch(() => {});
      }

      // Update user with new avatar path
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true }
      ).select('-password');

      res.json({ avatarUrl });
    } catch (error) {
      console.error('Error updating avatar:', error);
      res.status(500).json({ message: 'Failed to update avatar' });
    }
  });
};

// Get user settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('settings');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ message: 'Failed to get settings' });
  }
};

// Update user settings
export const updateSettings = async (req, res) => {
  try {
    const { notifications, privacy, security, appearance, language } = req.body;
    
    // Validate settings
    const validSettings = {
      notifications: {
        email: typeof notifications?.email === 'boolean' ? notifications.email : undefined,
        push: typeof notifications?.push === 'boolean' ? notifications.push : undefined,
        updates: typeof notifications?.updates === 'boolean' ? notifications.updates : undefined
      },
      privacy: {
        publicProfile: typeof privacy?.publicProfile === 'boolean' ? privacy.publicProfile : undefined,
        showActivity: typeof privacy?.showActivity === 'boolean' ? privacy.showActivity : undefined,
        shareStats: typeof privacy?.shareStats === 'boolean' ? privacy.shareStats : undefined
      },
      security: {
        twoFactor: typeof security?.twoFactor === 'boolean' ? security.twoFactor : undefined,
        loginAlerts: typeof security?.loginAlerts === 'boolean' ? security.loginAlerts : undefined,
        deviceHistory: typeof security?.deviceHistory === 'boolean' ? security.deviceHistory : undefined
      },
      appearance: {
        darkMode: typeof appearance?.darkMode === 'boolean' ? appearance.darkMode : undefined,
        compactView: typeof appearance?.compactView === 'boolean' ? appearance.compactView : undefined,
        showThumbnails: typeof appearance?.showThumbnails === 'boolean' ? appearance.showThumbnails : undefined
      },
      language: typeof language === 'string' ? language : undefined
    };

    // Remove undefined values
    Object.keys(validSettings).forEach(key => {
      if (typeof validSettings[key] === 'object') {
        Object.keys(validSettings[key]).forEach(subKey => {
          if (validSettings[key][subKey] === undefined) {
            delete validSettings[key][subKey];
          }
        });
      } else if (validSettings[key] === undefined) {
        delete validSettings[key];
      }
    });

    // Get current user settings
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Merge current settings with new settings
    const mergedSettings = {
      notifications: { ...currentUser.settings.notifications, ...validSettings.notifications },
      privacy: { ...currentUser.settings.privacy, ...validSettings.privacy },
      security: { ...currentUser.settings.security, ...validSettings.security },
      appearance: { ...currentUser.settings.appearance, ...validSettings.appearance },
      language: validSettings.language || currentUser.settings.language
    };

    // Update user settings
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: mergedSettings },
      { new: true }
    ).select('-password');

    // Handle two-factor authentication changes
    if (validSettings.security?.twoFactor !== undefined) {
      // Here you would implement 2FA setup/removal logic
      console.log('2FA setting changed:', validSettings.security.twoFactor);
    }

    res.json(user.toPublicJSON());
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

// Reset settings to default
export const resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      notifications: {
        email: true,
        push: true,
        updates: false
      },
      privacy: {
        publicProfile: false,
        showActivity: true,
        shareStats: false
      },
      security: {
        twoFactor: false,
        loginAlerts: true,
        deviceHistory: true
      },
      appearance: {
        darkMode: false,
        compactView: false,
        showThumbnails: true
      },
      language: 'en'
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { settings: defaultSettings },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toPublicJSON());
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Failed to reset settings' });
  }
};

// Update password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
};

// Update user statistics
export const updateStats = async (req, res) => {
  try {
    const { storageUsed, filesCount } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        storageUsed,
        filesCount,
        lastActive: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toPublicJSON());
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ message: 'Failed to update user stats' });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's avatar if exists
    if (user.avatar) {
      const avatarPath = path.join(uploadsDir, path.basename(user.avatar));
      await fs.unlink(avatarPath).catch(() => {});
    }

    // Delete user
    await user.deleteOne();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
}; 