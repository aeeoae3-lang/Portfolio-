import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const PRIMARY_OWNER_EMAIL = 'kalkotwaratharva77@gmail.com';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (Do NOT store in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string, isOwner: boolean) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const isOwner = checkIsOwner(user.email);
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken, isOwner);
      } else if (!isSigningIn) {
        // User is recognized by Firebase, but fresh access token needed via interactive sign-in
        if (onAuthSuccess) onAuthSuccess(user, '', isOwner);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; isOwner: boolean } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }

    cachedAccessToken = credential.accessToken;
    const isOwner = checkIsOwner(result.user.email);
    return { user: result.user, accessToken: cachedAccessToken, isOwner };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const checkIsOwner = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === PRIMARY_OWNER_EMAIL.toLowerCase()) return true;

  // Also check if developer configured alternate owner in localStorage for testing
  try {
    const customOwner = localStorage.getItem('agri_custom_owner');
    if (customOwner && cleanEmail === customOwner.trim().toLowerCase()) {
      return true;
    }
  } catch {
    // Ignore storage issues
  }
  return false;
};
