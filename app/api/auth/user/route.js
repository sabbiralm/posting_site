import { NextResponse } from "next/server";
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    const { uid, email, displayName, photoURL } = await request.json();

    // Validation
    if (!uid || !email || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ uid }, { email }] 
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await User.findOneAndUpdate(
        { $or: [{ uid }, { email }] },
        { 
          displayName,
          photoURL,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
        message: 'User updated successfully' 
      });
    } else {
      // Create new user
      const newUser = new User({
        uid,
        email,
        displayName,
        photoURL,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newUser.save();

      return NextResponse.json({ 
        success: true, 
        user: newUser,
        message: 'User created successfully' 
      });
    }

  } catch (error) {
    console.error('Error in user API:', error);
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email or UID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to fetch user data
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const email = searchParams.get('email');

    if (!uid && !email) {
      return NextResponse.json(
        { error: 'UID or email parameter is required' },
        { status: 400 }
      );
    }

    const query = {};
    if (uid) query.uid = uid;
    if (email) query.email = email;

    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user 
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}