import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// GET user profile
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ uid });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove sensitive data
    const userData = user.toObject();
    delete userData._id;
    delete userData.__v;
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// UPDATE user profile
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { uid, ...updateData } = body;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if displayName is provided and not empty
    if (!updateData.displayName || updateData.displayName.trim() === '') {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    // Fields that can be updated
    const allowedFields = [
      'displayName', 'phone', 'bio', 'website', 'location', 
      'dateOfBirth', 'gender', 'institution', 'subject', 
      'grade', 'experience', 'qualifications', 'socialLinks',
      'emailNotifications', 'smsNotifications', 'photoURL'
    ];
    
    // Filter only allowed fields and remove empty strings
    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        // Handle different data types
        if (key === 'qualifications' && Array.isArray(updateData[key])) {
          filteredData[key] = updateData[key];
        } else if (key === 'socialLinks' && typeof updateData[key] === 'object') {
          filteredData[key] = updateData[key];
        } else if (key === 'dateOfBirth' && updateData[key]) {
          filteredData[key] = new Date(updateData[key]);
        } else if (updateData[key] !== undefined && updateData[key] !== null) {
          filteredData[key] = updateData[key];
        }
      }
    });

    // Add updatedAt timestamp
    filteredData.updatedAt = new Date();
    
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { $set: filteredData },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove sensitive data
    const userData = updatedUser.toObject();
    delete userData._id;
    delete userData.__v;
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userData
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}