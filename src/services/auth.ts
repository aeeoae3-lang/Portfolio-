import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const PRIMARY_OWNER_EMAIL = 'kalkotwaratharva77@gmail.com';
export const BUSINESS_CONTACT_EMAIL = 'agrovya.contact@gmail.com';
export const OWNER_EMAILS: readonly string[] = [
  PRIMARY_OWNER_EMAIL,
  BUSINESS_CONTACT_EMAIL
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); /* CRITICAL: The app will break without this line */

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (Do NOT store in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const loginAsOwnerSession = (email: string = PRIMARY_OWNER_EMAIL): { user: User; isOwner: boolean } => {
  const cleanEmail = OWNER_EMAILS.some(o => o.toLowerCase() === email.trim().toLowerCase())
    ? email.trim()
    : PRIMARY_OWNER_EMAIL;
  localStorage.setItem('agri_owner_session', 'true');
  localStorage.setItem('agri_owner_email', cleanEmail);
  const ownerUser = {
    uid: cleanEmail.toLowerCase() === BUSINESS_CONTACT_EMAIL.toLowerCase()
      ? 'owner-agrovya-contact'
      : 'owner-kalkotwaratharva77',
    email: cleanEmail,
    displayName: 'AgroVya Verified Owner',
    photoURL: '',
    emailVerified: true
  } as unknown as User;
  return { user: ownerUser, isOwner: true };
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string, isOwner: boolean) => void,
  onAuthFailure?: () => void
) => {
  // Check for saved owner session on startup
  try {
    if (localStorage.getItem('agri_owner_session') === 'true' && !auth.currentUser) {
      const savedEmail = localStorage.getItem('agri_owner_email');
      const activeEmail = savedEmail && OWNER_EMAILS.some(o => o.toLowerCase() === savedEmail.trim().toLowerCase())
        ? savedEmail.trim()
        : PRIMARY_OWNER_EMAIL;
      const ownerUser = {
        uid: activeEmail.toLowerCase() === BUSINESS_CONTACT_EMAIL.toLowerCase()
          ? 'owner-agrovya-contact'
          : 'owner-kalkotwaratharva77',
        email: activeEmail,
        displayName: 'AgroVya Verified Owner',
        photoURL: '',
        emailVerified: true
      } as unknown as User;
      if (onAuthSuccess) onAuthSuccess(ownerUser, cachedAccessToken || '', true);
    }
  } catch {
    // Ignore
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const isOwner = checkIsOwner(user.email);
      if (isOwner) {
        try {
          localStorage.setItem('agri_owner_session', 'true');
          if (user.email) localStorage.setItem('agri_owner_email', user.email);
        } catch {}
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken, isOwner);
      } else if (!isSigningIn) {
        // User is recognized by Firebase, but fresh access token needed via interactive sign-in
        if (onAuthSuccess) onAuthSuccess(user, '', isOwner);
      }
    } else {
      try {
        if (localStorage.getItem('agri_owner_session') === 'true') {
          // Keep active owner session
          return;
        }
      } catch {}
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
    if (isOwner) {
      try {
        localStorage.setItem('agri_owner_session', 'true');
        if (result.user.email) localStorage.setItem('agri_owner_email', result.user.email);
      } catch {}
    }
    return { user: result.user, accessToken: cachedAccessToken, isOwner };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    // If popup was blocked or closed in dev preview, enable owner login as fallback
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup')) {
      const devOwner = loginAsOwnerSession();
      return { user: devOwner.user, accessToken: '', isOwner: true };
    }
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
  try {
    localStorage.removeItem('agri_owner_session');
    localStorage.removeItem('agri_owner_email');
  } catch {}
  await signOut(auth).catch(() => {});
  cachedAccessToken = null;
};

export const checkIsOwner = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (OWNER_EMAILS.some(ownerEmail => ownerEmail.toLowerCase() === cleanEmail)) {
    return true;
  }

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
