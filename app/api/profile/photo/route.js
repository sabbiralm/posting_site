import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { uid, photoURL } = body;
    
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!photoURL) {
      return NextResponse.json(
        { error: 'Photo URL is required' },
        { status: 400 }
      );
    }
    
    const updatedUser = await User.findOneAndUpdate(
      { uid },
      { 
        $set: { 
          photoURL,
          updatedAt: new Date()
        } 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Profile photo updated successfully',
      photoURL: updatedUser.photoURL
    });
    
  } catch (error) {
    console.error('Profile photo update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile photo' },
      { status: 500 }
    );
  }
}