import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Calendar as CalendarIcon, Edit3, Activity, CheckCircle2, XCircle, RefreshCw, LogOut, Camera, KeyRound } from 'lucide-react';
import { auth } from '../firebase';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
};

const getUserInitials = (name: string, email: string) => {
  if (name) return name.split(' ').map((n) => n[0]?.toUpperCase() || '').join('').slice(0, 2);
  if (email) return email[0]?.toUpperCase() || '?';
  return '?';
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

const mockBookings = [
  {
    id: 'b1',
    route: 'City Center → Airport',
    date: '2025-07-21T10:00:00',
    bus: 'B101',
    seat: '12A',
    status: 'Upcoming',
  },
  {
    id: 'b2',
    route: 'Downtown → University',
    date: '2025-07-10T18:00:00',
    bus: 'B205',
    seat: '7B',
    status: 'Completed',
  },
  {
    id: 'b3',
    route: 'Mall → Residential',
    date: '2025-06-30T15:30:00',
    bus: 'B312',
    seat: '3C',
    status: 'Cancelled',
  },
];

const mockBuses = [
  { id: 'bus1', name: 'B101', route: 'City Center → Airport', capacity: 40, accessible: true },
  { id: 'bus2', name: 'B205', route: 'Downtown → University', capacity: 30, accessible: false },
  { id: 'bus3', name: 'B312', route: 'Mall → Residential', capacity: 50, accessible: true },
];

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
  const [dashboardTab, setDashboardTab] = useState<'profile' | 'bookings' | 'settings'>('profile');
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [adminTab, setAdminTab] = useState<'users' | 'bookings' | 'buses' | 'settings'>('users');
  const [buses, setBuses] = useState(mockBuses);
  const [newBus, setNewBus] = useState({ name: '', route: '', capacity: '', accessible: false });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userDeleteId, setUserDeleteId] = useState<string | null>(null);

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

  // Admin detection
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const q = query(collection(db, 'admin'), where('email', '==', user.email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setRole('admin');
      } else {
        setRole('user');
      }
    };
    checkAdmin();
  }, [user]);

  // Fetch all users for admin
  useEffect(() => {
    if (role !== 'admin' || adminTab !== 'users') return;
    setUsersLoading(true);
    getDocs(collection(db, 'users')).then(snap => {
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('User docs:', users);
      setAllUsers(users);
    }).finally(() => setUsersLoading(false));
  }, [role, adminTab]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'users', id));
    setAllUsers(users => users.filter(u => u.id !== id));
  };

  if (user) {
    if (role === null) {
      return <div className="flex justify-center items-center min-h-[60vh] text-lg">Loading dashboard...</div>;
    }
    if (role === 'admin') {
      // Admin dashboard
      return (
        <div className="flex min-h-[80vh]">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:flex flex-col py-8 px-4 rounded-l-lg shadow-lg">
            <div className="mb-8 text-2xl font-bold flex items-center gap-2">
              <UserIcon className="h-7 w-7 text-blue-400" /> Admin Dashboard
            </div>
            <nav className="flex flex-col gap-2">
              <button onClick={() => setAdminTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded ${adminTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><UserIcon className="h-5 w-5" />Users</button>
              <button onClick={() => setAdminTab('bookings')} className={`flex items-center gap-2 px-4 py-2 rounded ${adminTab === 'bookings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Activity className="h-5 w-5" />Bookings</button>
              <button onClick={() => setAdminTab('buses')} className={`flex items-center gap-2 px-4 py-2 rounded ${adminTab === 'buses' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Edit3 className="h-5 w-5" />Buses</button>
              <button onClick={() => setAdminTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded ${adminTab === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Edit3 className="h-5 w-5" />Settings</button>
            </nav>
          </aside>
          {/* Main content */}
          <main className="flex-1 p-4 md:p-12 bg-transparent md:bg-white dark:md:bg-gray-800 rounded-r-lg shadow-lg md:ml-0 mt-0 md:mt-8">
            {adminTab === 'users' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Users</h2>
                {usersLoading ? (
                  <div className="text-gray-500 dark:text-gray-400">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <thead>
                        <tr className="text-left">
                          <th className="px-4 py-2">Avatar</th>
                          <th className="px-4 py-2">Username</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Created</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => (
                          <tr key={u.id} className="border-t border-gray-300 dark:border-gray-600">
                            <td className="px-4 py-2">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                  {getUserInitials(u.username, u.email)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 font-semibold">{u.username || '-'}</td>
                            <td className="px-4 py-2">{u.email || '-'}</td>
                            <td className="px-4 py-2">{
                              u.createdAt
                                ? (typeof u.createdAt === 'string'
                                    ? u.createdAt
                                    : (u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'))
                                : '-'
                            }</td>
                            <td className="px-4 py-2">
                              {u.id !== user.uid && (
                                <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Delete</button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {allUsers.length === 0 && <tr><td colSpan={5} className="text-gray-500 dark:text-gray-400 px-4 py-2">No users found. (Check Firestore 'users' collection and field names.)</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            {adminTab === 'bookings' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Bookings</h2>
                <div className="text-gray-700 dark:text-gray-200 mb-4">Booking management coming soon!</div>
              </>
            )}
            {adminTab === 'buses' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Buses</h2>
                {/* Add Bus Form */}
                <form className="mb-6 flex flex-col md:flex-row gap-4 items-end" onSubmit={e => {
                  e.preventDefault();
                  if (!newBus.name || !newBus.route || !newBus.capacity) return;
                  setBuses(prev => [...prev, { ...newBus, id: `bus${prev.length + 1}`, capacity: Number(newBus.capacity) }]);
                  setNewBus({ name: '', route: '', capacity: '', accessible: false });
                }}>
                  <input type="text" placeholder="Bus Name/Number" className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none" value={newBus.name} onChange={e => setNewBus({ ...newBus, name: e.target.value })} required />
                  <input type="text" placeholder="Route (e.g. A → B)" className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none" value={newBus.route} onChange={e => setNewBus({ ...newBus, route: e.target.value })} required />
                  <input type="number" placeholder="Capacity" className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none" value={newBus.capacity} onChange={e => setNewBus({ ...newBus, capacity: e.target.value })} required min={1} />
                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <input type="checkbox" checked={newBus.accessible} onChange={e => setNewBus({ ...newBus, accessible: e.target.checked })} /> Wheelchair Accessible
                  </label>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Bus</button>
                </form>
                {/* Bus List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <thead>
                      <tr className="text-left">
                        <th className="px-4 py-2">Name/Number</th>
                        <th className="px-4 py-2">Route</th>
                        <th className="px-4 py-2">Capacity</th>
                        <th className="px-4 py-2">Accessible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buses.map(bus => (
                        <tr key={bus.id} className="border-t border-gray-300 dark:border-gray-600">
                          <td className="px-4 py-2 font-semibold">{bus.name}</td>
                          <td className="px-4 py-2">{bus.route}</td>
                          <td className="px-4 py-2">{bus.capacity}</td>
                          <td className="px-4 py-2">{bus.accessible ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {adminTab === 'settings' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Settings</h2>
                <div className="text-gray-700 dark:text-gray-200 mb-4">Settings coming soon!</div>
              </>
            )}
            <button onClick={() => { signOut(); navigate('/'); }} className="mt-8 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"><LogOut className="h-4 w-4 mr-1" />Sign Out</button>
          </main>
        </div>
      );
    }
    if (profileLoading) {
      return <div className="flex justify-center items-center min-h-[60vh] text-lg">Loading profile...</div>;
    }
    return (
      <div className="flex min-h-[80vh]">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:flex flex-col py-8 px-4 rounded-l-lg shadow-lg">
          <div className="mb-8 text-2xl font-bold flex items-center gap-2">
            <UserIcon className="h-7 w-7 text-blue-400" /> Dashboard
          </div>
          <nav className="flex flex-col gap-2">
            <button onClick={() => setDashboardTab('profile')} className={`flex items-center gap-2 px-4 py-2 rounded ${dashboardTab === 'profile' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><UserIcon className="h-5 w-5" />Profile</button>
            <button onClick={() => setDashboardTab('bookings')} className={`flex items-center gap-2 px-4 py-2 rounded ${dashboardTab === 'bookings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Activity className="h-5 w-5" />Bookings</button>
            <button onClick={() => setDashboardTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded ${dashboardTab === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Edit3 className="h-5 w-5" />Settings</button>
          </nav>
        </aside>
        {/* Mobile sidebar */}
        <aside className="md:hidden w-full flex flex-row justify-around bg-gray-900 text-white py-2 fixed bottom-0 left-0 z-40">
          <button onClick={() => setDashboardTab('profile')} className={`flex flex-col items-center px-2 ${dashboardTab === 'profile' ? 'text-blue-400' : ''}`}><UserIcon className="h-6 w-6" /><span className="text-xs">Profile</span></button>
          <button onClick={() => setDashboardTab('bookings')} className={`flex flex-col items-center px-2 ${dashboardTab === 'bookings' ? 'text-blue-400' : ''}`}><Activity className="h-6 w-6" /><span className="text-xs">Bookings</span></button>
          <button onClick={() => setDashboardTab('settings')} className={`flex flex-col items-center px-2 ${dashboardTab === 'settings' ? 'text-blue-400' : ''}`}><Edit3 className="h-6 w-6" /><span className="text-xs">Settings</span></button>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-12 bg-transparent md:bg-white dark:md:bg-gray-800 rounded-r-lg shadow-lg md:ml-0 mt-0 md:mt-8">
          {/* Toast */}
          {toast && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
          )}
          {dashboardTab === 'profile' && (
            <>
              {/* ... existing profile UI ... */}
              {/* (Paste the entire profile card, edit form, etc. here) */}
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
                      <input id="edit-photo" type="file" accept="image/*" onChange={e => setEditPhoto(e.target.files?.[0] || null)} className="hidden" title="Upload a profile picture" placeholder="Profile picture" />
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
            </>
          )}
          {dashboardTab === 'bookings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Activity className="h-6 w-6 text-blue-500" />My Bookings</h2>
              <div className="grid gap-4">
                {mockBookings.map(b => (
                  <div key={b.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 shadow">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900 dark:text-white">{b.route}</div>
                      <div className="text-gray-600 dark:text-gray-300">Date: {new Date(b.date).toLocaleString()}</div>
                      <div className="text-gray-600 dark:text-gray-300">Bus: {b.bus} | Seat: {b.seat}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${b.status === 'Upcoming' ? 'bg-blue-200 text-blue-800' : b.status === 'Completed' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{b.status}</span>
                      {b.status === 'Upcoming' && <button className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Cancel</button>}
                      {b.status === 'Completed' && <button className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">View Ticket</button>}
                    </div>
                  </div>
                ))}
                {mockBookings.length === 0 && <div className="text-gray-500 dark:text-gray-400">No bookings found.</div>}
              </div>
            </div>
          )}
          {dashboardTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Edit3 className="h-6 w-6 text-blue-500" />Settings</h2>
              <div className="text-gray-500 dark:text-gray-400">Settings coming soon...</div>
            </div>
          )}
        </main>
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