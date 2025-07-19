import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Calendar as CalendarIcon, Edit3, Activity, CheckCircle2, XCircle, RefreshCw, LogOut, Camera, KeyRound } from 'lucide-react';
import { auth } from '../firebase';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
};

function getFriendlyFirebaseError(error: any) {
  if (!error || !error.code) return 'An unknown error occurred.';
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Network error: Please check your internet connection and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    default:
      return error.message || 'An unknown error occurred.';
  }
}

const ProfilePage: React.FC = () => {
  const { user, signIn, signOut } = useContext(AuthContext);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile from Firestore
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
          setEditUsername(snap.data().username || '');
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Handle photo preview
  useEffect(() => {
    if (editPhoto) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(editPhoto);
    } else {
      setPhotoPreview(null);
    }
  }, [editPhoto]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Edit profile handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        username: editUsername,
        ...(photoPreview ? { photoURL: photoPreview } : {}),
      });
      // Update Auth profile
      await updateProfile(user, {
        displayName: editUsername,
        ...(photoPreview ? { photoURL: photoPreview } : {}),
      });
      setProfile((prev: any) => ({ ...prev, username: editUsername, ...(photoPreview ? { photoURL: photoPreview } : {}) }));
      setToast({ type: 'success', message: 'Profile updated!' });
      setEditMode(false);
      setEditPhoto(null);
    } catch (err: any) {
      setToast({ type: 'error', message: getFriendlyFirebaseError(err) });
    } finally {
      setLoading(false);
    }
  };

  // Email verification
  const handleSendVerification = async () => {
    if (!user) return;
    setSendingVerification(true);
    try {
      await sendEmailVerification(user);
      setToast({ type: 'success', message: 'Verification email sent!' });
    } catch (err: any) {
      setToast({ type: 'error', message: getFriendlyFirebaseError(err) });
    } finally {
      setSendingVerification(false);
    }
  };

  // Password reset
  const handlePasswordReset = async () => {
    if (!user) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email!);
      setToast({ type: 'success', message: 'Password reset email sent!' });
    } catch (err: any) {
      setToast({ type: 'error', message: getFriendlyFirebaseError(err) });
    } finally {
      setSendingReset(false);
    }
  };

  // Sign up and sign in logic (unchanged)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      await updateProfile(cred.user, { displayName: signUpUsername });
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: signUpUsername,
        email: signUpEmail,
        createdAt: serverTimestamp(),
        photoURL: '',
      });
      signIn(cred.user);
      setSignUpUsername('');
      setSignUpEmail('');
      setSignUpPassword('');
    } catch (err: any) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      signIn(cred.user);
      setSignInEmail('');
      setSignInPassword('');
    } catch (err: any) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  if (user) {
    if (profileLoading) {
      return <div className="flex justify-center items-center min-h-[60vh] text-lg">Loading profile...</div>;
    }
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded shadow-lg">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
        )}
        <div className="flex flex-col md:flex-row md:items-center gap-8 mb-8">
          <div className="relative w-28 h-28 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-4xl font-bold text-blue-700 dark:text-blue-200 overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile?.username || user.displayName || user.email || '?')
            )}
            {editMode && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => setEditPhoto(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <UserIcon className="h-6 w-6 text-blue-600" />
              {profile?.username || user.displayName || 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <Mail className="h-5 w-5 text-blue-500" />
              {user.email}
              {user.emailVerified ? (
                <span className="flex items-center ml-2 text-green-600"><CheckCircle2 className="h-4 w-4 mr-1" />Verified</span>
              ) : (
                <button onClick={handleSendVerification} disabled={sendingVerification} className="ml-2 text-yellow-600 flex items-center hover:underline">
                  <XCircle className="h-4 w-4 mr-1" />Verify Email{sendingVerification && <RefreshCw className="h-4 w-4 animate-spin ml-1" />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Member since: {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <CalendarIcon className="h-5 w-5 text-blue-500" />
              Last login: {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setEditMode(v => !v)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"><Edit3 className="h-4 w-4 mr-1" />{editMode ? 'Cancel' : 'Edit Profile'}</button>
              <button onClick={handlePasswordReset} disabled={sendingReset} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 flex items-center ml-2"><KeyRound className="h-4 w-4 mr-1" />Change Password{sendingReset && <RefreshCw className="h-4 w-4 animate-spin ml-1" />}</button>
              <button onClick={() => { signOut(); navigate('/'); }} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center ml-2"><LogOut className="h-4 w-4 mr-1" />Sign Out</button>
            </div>
          </div>
        </div>
        {editMode && (
          <form onSubmit={handleProfileUpdate} className="mb-8 flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label htmlFor="edit-username" className="block text-gray-700 dark:text-gray-200 mb-1">Username</label>
              <input id="edit-username" type="text" className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none" value={editUsername} onChange={e => setEditUsername(e.target.value)} required title="Edit your username" placeholder="Username" />
            </div>
            <div className="flex-1">
              <label htmlFor="edit-photo" className="block text-gray-700 dark:text-gray-200 mb-1">Profile Picture</label>
              {photoPreview ? <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mb-2" /> : <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-2">No Image</div>}
              <input id="edit-photo" type="file" accept="image/*" onChange={e => setEditPhoto(e.target.files?.[0] || null)} className="block" title="Upload a profile picture" placeholder="Profile picture" />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}
        <div className="mb-6 w-full">
          <div className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center"><Activity className="h-4 w-4 mr-2 text-blue-500" />Recent Activity</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">No recent activity.</div>
        </div>
      </div>
    );
  }

  // --- Sign in/up UI (unchanged) ---
  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded shadow">
      <div className="flex mb-6">
        <button
          className={`flex-1 py-2 font-semibold rounded-l ${tab === 'signin' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          onClick={() => { setTab('signin'); setError(''); }}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2 font-semibold rounded-r ${tab === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          onClick={() => { setTab('signup'); setError(''); }}
        >
          Sign Up
        </button>
      </div>
      {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
      {tab === 'signin' ? (
        <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signInEmail}
            onChange={e => setSignInEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signInPassword}
            onChange={e => setSignInPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
          <label htmlFor="signup-username" className="sr-only">Username</label>
          <input
            id="signup-username"
            type="text"
            placeholder="Username"
            title="Username"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signUpUsername}
            onChange={e => setSignUpUsername(e.target.value)}
            required
          />
          <label htmlFor="signup-email" className="sr-only">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="Email"
            title="Email"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signUpEmail}
            onChange={e => setSignUpEmail(e.target.value)}
            required
          />
          <label htmlFor="signup-password" className="sr-only">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Password"
            title="Password"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signUpPassword}
            onChange={e => setSignUpPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfilePage; 