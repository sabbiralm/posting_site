// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Firebase Authentication Fields
  uid: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters long'],
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  photoURL: {
    type: String,
    default: null,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    default: '',
    trim: true
  },
  
  // Role and Status
  role: {
    type: String,
    enum: {
      values: ['student', 'teacher', 'admin'],
      message: 'Role must be student, teacher, or admin'
    },
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  website: {
    type: String,
    default: '',
    trim: true,
    match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL']
  },
  location: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other', 'prefer-not-to-say', ''],
      message: 'Gender must be male, female, other, prefer-not-to-say, or empty'
    },
    default: ''
  },
  
  // Educational Information
  institution: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Institution name cannot exceed 100 characters']
  },
  subject: {
    type: String,
    default: '',
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  grade: {
    type: String,
    default: '',
    trim: true,
    maxlength: [50, 'Grade cannot exceed 50 characters']
  },
  experience: {
    type: String,
    default: '',
    trim: true,
    maxlength: [200, 'Experience cannot exceed 200 characters']
  },
  qualifications: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 10; // Maximum 10 qualifications
      },
      message: 'Cannot have more than 10 qualifications'
    }
  },
  skills: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 20; // Maximum 20 skills
      },
      message: 'Cannot have more than 20 skills'
    }
  },
  
  // Social Links
  socialLinks: {
    facebook: { 
      type: String, 
      default: '',
      trim: true
    },
    twitter: { 
      type: String, 
      default: '',
      trim: true
    },
    linkedin: { 
      type: String, 
      default: '',
      trim: true
    },
    youtube: { 
      type: String, 
      default: '',
      trim: true
    },
    github: {
      type: String,
      default: '',
      trim: true
    },
    instagram: {
      type: String,
      default: '',
      trim: true
    }
  },
  
  // Preferences and Settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'bn', 'hi', 'es', 'fr'],
    message: 'Language must be en, bn, hi, es, or fr'
  },
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark', 'auto'],
    message: 'Theme must be light, dark, or auto'
  },
  
  // Statistics and Analytics
  postCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  shareCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Security and Privacy
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends-only'],
      default: 'public'
    },
    emailVisibility: {
      type: Boolean,
      default: false
    },
    phoneVisibility: {
      type: Boolean,
      default: false
    },
    onlineStatus: {
      type: Boolean,
      default: true
    }
  },
  
  // Timestamps
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  accountCreatedAt: {
    type: Date,
    default: Date.now
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true, // createdAt and updatedAt automatically managed
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this.uid}`;
});

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ displayName: 'text', bio: 'text' });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'privacySettings.profileVisibility': 1 });

// Middleware to update timestamps and trim fields
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update lastActiveAt when user data changes
  this.lastActiveAt = Date.now();
  
  // Trim all string fields
  const stringFields = [
    'displayName', 'bio', 'website', 'location', 'institution', 
    'subject', 'grade', 'experience', 'phoneNumber'
  ];
  
  stringFields.forEach(field => {
    if (this[field]) {
      this[field] = this[field].trim();
    }
  });
  
  // Calculate profile completion percentage
  this.calculateProfileCompletion();
  
  next();
});

// Method to calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  let completedFields = 0;
  const totalFields = 8; // Adjust based on important fields
  
  const fieldsToCheck = [
    this.displayName,
    this.email,
    this.bio,
    this.photoURL,
    this.institution,
    this.subject,
    this.location,
    this.dateOfBirth
  ];
  
  fieldsToCheck.forEach(field => {
    if (field && field.toString().trim().length > 0) {
      completedFields++;
    }
  });
  
  this.profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
  this.profileCompleted = this.profileCompletionPercentage >= 70; // 70% considered complete
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  // If previous lock has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if too many attempts
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + (2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Static method to find by Firebase UID
userSchema.statics.findByUid = function(uid) {
  return this.findOne({ uid });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, isBanned: false });
};

// Static method for text search
userSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    isActive: true,
    isBanned: false
  });
};

// Export the model
export default mongoose.models.User || mongoose.model('User', userSchema);