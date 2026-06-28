import { Request, Response, NextFunction } from 'express';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

// Initialize Firebase Admin (mocked for now until credentials are provided)
try {
  initializeApp({
    credential: applicationDefault() // Will use GOOGLE_APPLICATION_CREDENTIALS
  });
} catch (error) {
  console.log('Firebase admin initialization deferred or failed:', error);
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // FOR DEVELOPMENT ONLY: Mock auth if token is test-token
    if (process.env.NODE_ENV !== 'production' && idToken === 'test-token') {
      req.user = { uid: 'test-user-uid' } as DecodedIdToken;
      next();
      return;
    }

    // Attempt to verify token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
