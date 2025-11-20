"use client";

import { auth, googleProvider, storage } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: ""
  });

  // Check auth state to detect when user verifies email
  useEffect(() => {
    let intervalId;

    const checkVerificationStatus = async (currentUser) => {
        if (!currentUser || !verificationSent || showPhotoUpload) {
            return; // Only proceed if on verification screen
        }
        
        try {
            // Force reload user data to check for external verification
            await currentUser.reload();
            const reloadedUser = auth.currentUser; // Get the user object with refreshed data

            if (reloadedUser && reloadedUser.emailVerified) {
                // 1. Verification successful! Clear the interval
                clearInterval(intervalId);

                // 2. Clear verification-related states
                setPendingUser(null);
                setVerificationSent(false);

                // 3. Set the user for the next stage (photo upload)
                setVerifiedUser(reloadedUser);
                setShowPhotoUpload(true);

                // Optional: Show a successful message
                alert("Email verified successfully! You can now complete your profile.");
            }
        } catch (error) {
            console.error("Error checking verification status:", error);
            // Optionally handle error (e.g., if user was deleted)
        }
    };

    // Start checking only if a verification email has been sent
    if (verificationSent && !showPhotoUpload) {
        // Run the check immediately on component mount/state change
        checkVerificationStatus(auth.currentUser); 

        // Set interval to check every 3 seconds
        intervalId = setInterval(() => {
            // Must use auth.currentUser to get the latest user instance for reload
            checkVerificationStatus(auth.currentUser);
        }, 3000); // Check every 3 seconds
    }

    // Clean-up function to clear the interval when the component unmounts 
    // or dependencies (like verificationSent) change and condition is false.
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
}, [verificationSent, showPhotoUpload]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async (file) => {
    if (!file) return null;
    return await uploadToCloudinary(file);
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle photo upload after verification
  const handlePhotoUploadAfterVerification = async () => {
    if (!verifiedUser) return;

    try {
      setLoading(true);
      let photoURL = null;

      // Upload profile photo if selected
      if (selectedImage) {
        photoURL = await uploadImage(selectedImage);
        
        // Update user profile with photo
        await updateProfile(verifiedUser, {
          photoURL: photoURL
        });
      }

      // Create user record in database
      await handleUserCreation(verifiedUser);
      
      alert("Profile setup complete! Redirecting to dashboard...");
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Photo upload error:", error);
      alert("Failed to upload profile photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Skip photo upload
  const handleSkipPhotoUpload = async () => {
    if (!verifiedUser) return;

    try {
      setLoading(true);
      await handleUserCreation(verifiedUser);
      alert("Welcome! Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
      console.error("User creation error:", error);
      alert("Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await handleUserCreation(result.user);
    } catch (error) {
      console.error("Google login error:", error);
      alert(error.message || "Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign Up with Verification (without photo)
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      setLoading(true);
      
      // Create user with email and password
      const result = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Update profile with display name only (no photo yet)
      await updateProfile(result.user, {
        displayName: formData.displayName
      });

      // Send email verification
      await sendEmailVerification(result.user);
      
      setPendingUser(result.user);
      setVerificationSent(true);
      
      
      alert("Verification email sent! Please check your inbox and verify your email to continue.");
      
    } catch (error) {
      console.error("Sign up error:", error);
      alert(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Check if email is verified
      if (!result.user.emailVerified) {
        alert("Please verify your email address before logging in. Check your inbox for verification link.");
        await sendEmailVerification(result.user);
        return;
      }

      await handleUserCreation(result.user);
      
    } catch (error) {
      console.error("Login error:", error);
      alert(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!pendingUser) return;

    try {
      setLoading(true);
      await sendEmailVerification(pendingUser);
      alert("Verification email sent again! Please check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      alert("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      alert("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, formData.email);
      alert("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Forgot password error:", error);
      alert(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Common function to create/update user in database
  const handleUserCreation = async (user) => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user record');
      }

      console.log('User authentication successful:', data.message);
      return data;
      
    } catch (error) {
      console.error("User creation error:", error);
      throw error;
    }
  };

  // Error message helper
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please login.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/requires-recent-login': 'Please log out and log in again to perform this action.'
    };
    
    return errorMessages[errorCode] || 'Authentication failed. Please try again.';
  };

  // Reset form and states
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      displayName: ""
    });
    setSelectedImage(null);
    setImagePreview(null);
    setVerificationSent(false);
    setPendingUser(null);
    setShowPhotoUpload(false);
    setVerifiedUser(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ width: 400, margin: "50px auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
        {showPhotoUpload 
          ? "Complete Your Profile" 
          : showForgotPassword 
            ? "Reset Password" 
            : verificationSent 
              ? "Verify Your Email" 
              : (isLogin ? "Login" : "Sign Up")
        }
      </h2>

      {/* Photo Upload After Verification */}
      {showPhotoUpload && (
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            backgroundColor: "#e8f5e8", 
            padding: "20px", 
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            <h3 style={{ color: "#2e7d32", marginBottom: "10px" }}>
              Email Verified Successfully! 🎉
            </h3>
            <p style={{ marginBottom: "15px", color: "#555" }}>
              Welcome <strong>{verifiedUser?.displayName || verifiedUser?.email}</strong>
            </p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Complete your profile by adding a photo (optional)
            </p>
          </div>

          {/* Profile Photo Upload */}
          <div style={{ 
            textAlign: "center", 
            marginBottom: "20px",
            position: "relative",
            display: "inline-block",
            width: "100%"
          }}>
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px dashed #ddd",
              margin: "0 auto 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundColor: "#f9f9f9",
              cursor: "pointer"
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile preview" 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover" 
                  }} 
                />
              ) : (
                <div style={{ textAlign: "center", color: "#666" }}>
                  <div style={{ fontSize: "24px" }}>📷</div>
                  <div style={{ fontSize: "12px", marginTop: "5px" }}>Add Photo</div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              style={{ display: "none" }}
            />

            {imagePreview && (
              <button
                type="button"
                onClick={removeSelectedImage}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  marginBottom: "10px"
                }}
              >
                Remove Photo
              </button>
            )}

            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
              Click to upload profile photo (max 5MB)
            </div>
          </div>

          <button
            onClick={handlePhotoUploadAfterVerification}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#ccc" : "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "10px"
            }}
            disabled={loading}
          >
            {loading ? "Setting up..." : "Complete Profile"}
          </button>
          
          <button
            onClick={handleSkipPhotoUpload}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "transparent",
              color: "#1976d2",
              border: "1px solid #1976d2",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
            disabled={loading}
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Verification Sent Screen */}
      {verificationSent && !showPhotoUpload && (
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            backgroundColor: "#e8f5e8", 
            padding: "20px", 
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            <h3 style={{ color: "#2e7d32", marginBottom: "10px" }}>
              Check Your Email!
            </h3>
            <p style={{ marginBottom: "15px", color: "#555" }}>
              We've sent a verification link to <strong>{formData.email}</strong>
            </p>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Please click the link in the email to verify your account. After verification, you'll be able to add a profile photo and complete your setup.
            </p>
          </div>
          
          <button
            onClick={handleResendVerification}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#ccc" : "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "15px"
            }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setIsLogin(true);
            }}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "transparent",
              color: "#1976d2",
              border: "1px solid #1976d2",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Back to Login
          </button>
        </div>
      )}

      {/* Rest of the forms (Forgot Password, Login, Signup) */}
      {/* ... (Keep the existing form code for forgot password, login, and signup as you had) */}
      {!showPhotoUpload && !verificationSent && (
        <>
          {/* Forgot Password Form */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: "15px" }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "16px"
                  }}
                  required
                />
              </div>
              
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: loading ? "#ccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginBottom: "15px"
                }}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "transparent",
                  color: "#007bff",
                  border: "1px solid #007bff",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Back to Login
              </button>
            </form>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={isLogin ? handleEmailLogin : handleEmailSignUp}>
                {!isLogin && (
                  <>
                    {/* Display Name */}
                    <div style={{ marginBottom: "15px" }}>
                      <input
                        type="text"
                        name="displayName"
                        placeholder="Full Name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "16px",
                          marginBottom: "15px"
                        }}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div style={{ marginBottom: "15px" }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "16px",
                      marginBottom: "15px"
                    }}
                    required
                  />
                  
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "16px",
                      marginBottom: isLogin ? "15px" : "15px"
                    }}
                    required
                  />
                  
                  {!isLogin && (
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                        marginBottom: "15px"
                      }}
                      required
                    />
                  )}
                </div>
                
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: loading ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginBottom: "15px"
                  }}
                  disabled={loading}
                >
                  {loading ? "Please wait..." : (isLogin ? "Login" : "Sign Up")}
                </button>
              </form>

              {/* Forgot Password Link */}
              {isLogin && (
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Toggle between Login and Signup */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetForm();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              </div>

              {/* Divider */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                margin: "20px 0" 
              }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }}></div>
                <span style={{ padding: "0 15px", color: "#666" }}>OR</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }}></div>
              </div>

              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: loading ? "#ccc" : "#db4437",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
                disabled={loading}
              >
                <span>Login with Google</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}