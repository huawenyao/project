import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authRateLimit, passwordResetRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Mock authentication for demo purposes
// In production, integrate with proper authentication service

// Register new user
router.post('/register', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email, password, and name are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }

  // Mock user creation
  const user = {
    id: `user_${Date.now()}`,
    email,
    name,
    tier: 'free',
    createdAt: new Date().toISOString()
  };

  // Mock JWT token
  const token = `mock_jwt_token_${user.id}`;

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
      expiresIn: '24h'
    }
  });
}));

// Login user
router.post('/login', authRateLimit, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      }
    });
  }

  // Mock authentication
  if (email === 'demo@example.com' && password === 'demo123') {
    const user = {
      id: 'user_demo',
      email,
      name: 'Demo User',
      tier: 'pro',
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    const token = `mock_jwt_token_${user.id}`;

    res.json({
      success: true,
      data: {
        user,
        token,
        expiresIn: '24h'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      }
    });
  }

  // Mock token refresh
  const newToken = `mock_jwt_token_refreshed_${Date.now()}`;

  res.json({
    success: true,
    data: {
      token: newToken,
      expiresIn: '24h'
    }
  });
}));

// Logout user
router.post('/logout', asyncHandler(async (req, res) => {
  // In a real implementation, you would invalidate the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  // Mock user data based on token
  const user = {
    id: 'user_demo',
    email: 'demo@example.com',
    name: 'Demo User',
    tier: 'pro',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  };

  res.json({
    success: true,
    data: user
  });
}));

// Update user profile
router.put('/me', asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // Mock profile update
  const updatedUser = {
    id: 'user_demo',
    email: email || 'demo@example.com',
    name: name || 'Demo User',
    tier: 'pro',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: updatedUser
  });
}));

// Change password
router.put('/password', authRateLimit, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      }
    });
  }

  // Mock password change
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Request password reset
router.post('/forgot-password', passwordResetRateLimit, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      }
    });
  }

  // Mock password reset email
  res.json({
    success: true,
    message: 'Password reset email sent if account exists'
  });
}));

// Reset password with token
router.post('/reset-password', passwordResetRateLimit, asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Token and new password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }

  // Mock password reset
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// Verify email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Verification token is required',
        code: 'MISSING_TOKEN'
      }
    });
  }

  // Mock email verification
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// Resend verification email
router.post('/resend-verification', authRateLimit, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email is required',
        code: 'MISSING_EMAIL'
      }
    });
  }

  // Mock resend verification
  res.json({
    success: true,
    message: 'Verification email sent if account exists'
  });
}));

export default router;