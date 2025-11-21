import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
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
  
  // Profile Information
  phone: {
    type: String,
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'other', ''],
      message: 'Gender must be male, female, other, or empty'
    },
    default: ''
  },
  
  // Educational Information
  institution: {
    type: String,
    default: '',
    trim: true
  },
  subject: {
    type: String,
    default: '',
    trim: true
  },
  grade: {
    type: String,
    default: '',
    trim: true
  },
  experience: {
    type: String,
    default: '',
    trim: true
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
    }
  },
  
  // Settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Trim string fields
  if (this.displayName) this.displayName = this.displayName.trim();
  if (this.phone) this.phone = this.phone.trim();
  if (this.bio) this.bio = this.bio.trim();
  if (this.website) this.website = this.website.trim();
  if (this.location) this.location = this.location.trim();
  if (this.institution) this.institution = this.institution.trim();
  if (this.subject) this.subject = this.subject.trim();
  if (this.grade) this.grade = this.grade.trim();
  if (this.experience) this.experience = this.experience.trim();
  
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);