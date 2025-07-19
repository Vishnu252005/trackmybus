import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Calendar as CalendarIcon, Edit3, Activity } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      await updateProfile(cred.user, { displayName: signUpUsername });
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

  if (user) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-200 mb-2">
            {getInitials(user.displayName || user.email || '?')}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            {user.displayName || 'N/A'}
          </div>
        </div>
        <div className="mb-4 space-y-2">
          <div className="flex items-center text-gray-700 dark:text-gray-200"><Mail className="h-4 w-4 mr-2 text-blue-500" />{user.email}</div>
          <div className="flex items-center text-gray-700 dark:text-gray-200"><CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />Member since: {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</div>
        </div>
        <button
          className="flex items-center px-4 py-2 mb-6 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 cursor-not-allowed"
          disabled
        >
          <Edit3 className="h-4 w-4 mr-2" /> Edit Profile (coming soon)
        </button>
        <div className="mb-6 w-full">
          <div className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center"><Activity className="h-4 w-4 mr-2 text-blue-500" />Recent Activity</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">No recent activity.</div>
        </div>
        <button
          onClick={() => { signOut(); navigate('/'); }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
        >
          Sign Out
        </button>
      </div>
    );
  }

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
          <input
            type="text"
            placeholder="Username"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signUpUsername}
            onChange={e => setSignUpUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            value={signUpEmail}
            onChange={e => setSignUpEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
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