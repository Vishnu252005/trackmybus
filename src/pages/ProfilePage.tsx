import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Calendar as CalendarIcon, Edit3, Activity, CheckCircle2, XCircle, RefreshCw, LogOut, Camera, KeyRound } from 'lucide-react';
import { auth } from '../firebase';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import AssistantPage from './AssistantPage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [buses, setBuses] = useState<any[]>([]);
  const [busesLoading, setBusesLoading] = useState(false);
  const [timingsMap, setTimingsMap] = useState<{ [busId: string]: any[] }>({});
  const [timingInputs, setTimingInputs] = useState<{ [busId: string]: { time: string; availableSeats: string } }>({});
  // Update newBus state to have start and end
  const [newBus, setNewBus] = useState({ name: '', start: '', end: '', capacity: '', accessible: false });
  const [editBusId, setEditBusId] = useState<string | null>(null);
  const [editBus, setEditBus] = useState<any>(null);
  const [editTiming, setEditTiming] = useState<{ busId: string; timingId: string; time: string; availableSeats: string } | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userDeleteId, setUserDeleteId] = useState<string | null>(null);
  const [addTimingBusId, setAddTimingBusId] = useState<string | null>(null);
  const [groqInput, setGroqInput] = useState('');
  const [groqResponse, setGroqResponse] = useState('');
  const [groqLoading, setGroqLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userBookingsLoading, setUserBookingsLoading] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);

  // Fetch user profile from Firestore
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const userData = snap.data();
          setProfile(userData);
          setEditUsername(userData.username || '');
          setUserCredits(userData.credits || 0);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Function to update user credits
  const updateUserCredits = async (newCredits: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        credits: newCredits
      });
      setUserCredits(newCredits);
      setProfile((prev: any) => ({ ...prev, credits: newCredits }));
      setToast({ type: 'success', message: `Credits updated to ${newCredits}!` });
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to update credits.' });
    }
  };

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
        credits: 100, // Starting credits for new users
      });
      signIn(cred.user);
      setSignUpUsername('');
      setSignUpEmail('');
      setSignUpPassword('');
      setToast({ type: 'success', message: 'Account created successfully! You have 100 starting credits!' });
    } catch (err: any) {
      setError(getFriendlyFirebaseError(err));
      setToast({ type: 'error', message: getFriendlyFirebaseError(err) });
    } finally {
      setLoading(false);
    }
  };

  // Create test user for debugging
  const createTestUser = async () => {
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'test123456';
      const testUsername = 'TestUser';
      
      console.log('Creating test user...');
      const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      await updateProfile(cred.user, { displayName: testUsername });
      await setDoc(doc(db, 'users', cred.user.uid), {
        username: testUsername,
        email: testEmail,
        createdAt: serverTimestamp(),
        photoURL: '',
      });
      
      setSignInEmail(testEmail);
      setSignInPassword(testPassword);
      setToast({ type: 'success', message: 'Test user created! You can now sign in with test@example.com / test123456' });
    } catch (err: any) {
      console.error('Error creating test user:', err);
      if (err.code === 'auth/email-already-in-use') {
        setSignInEmail('test@example.com');
        setSignInPassword('test123456');
        setToast({ type: 'success', message: 'Test user already exists! Use test@example.com / test123456 to sign in' });
      } else {
        setToast({ type: 'error', message: getFriendlyFirebaseError(err) });
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Attempting sign in with:', { email: signInEmail, password: signInPassword ? '***' : 'empty' });
    
    try {
      const cred = await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      console.log('Sign in successful:', cred.user.email);
      signIn(cred.user);
      setSignInEmail('');
      setSignInPassword('');
      setToast({ type: 'success', message: 'Successfully signed in!' });
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorMessage = getFriendlyFirebaseError(err);
      setError(errorMessage);
      setToast({ type: 'error', message: errorMessage });
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

  // Fetch bookings for admin
  useEffect(() => {
    if (role !== 'admin' || adminTab !== 'bookings') return;
    setBookingsLoading(true);
    getDocs(collection(db, 'bookings')).then(snap => {
      const bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookings);
    }).finally(() => setBookingsLoading(false));
  }, [role, adminTab]);
  // Fetch buses for admin
  useEffect(() => {
    if (role !== 'admin' || adminTab !== 'buses') return;
    setBusesLoading(true);
    getDocs(collection(db, 'buses')).then(async snap => {
      const buses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBuses(buses);
      // Fetch timings for each bus
      const timingsObj: { [busId: string]: any[] } = {};
      await Promise.all(buses.map(async (bus: any) => {
        const timingsSnap = await getDocs(collection(db, 'buses', bus.id, 'timings'));
        timingsObj[bus.id] = timingsSnap.docs.map(t => ({ id: t.id, ...t.data() }));
      }));
      setTimingsMap(timingsObj);
    }).finally(() => setBusesLoading(false));
  }, [role, adminTab]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'users', id));
    setAllUsers(users => users.filter(u => u.id !== id));
  };

  async function askGroq(prompt: string) {
    setGroqLoading(true);
    setGroqResponse('');
    setGroqInput(prompt);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_GROQ_API_KEY`, // <-- replace with your key or env
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: 'You are an AI assistant for bus admin tasks.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 512,
          temperature: 0.2,
        }),
      });
      const data = await res.json();
      setGroqResponse(data.choices?.[0]?.message?.content || 'No response.');
    } catch (e) {
      setGroqResponse('Error contacting Groq API.');
    } finally {
      setGroqLoading(false);
    }
  }

  // Fetch bookings for current user
  useEffect(() => {
    if (!user) return;
    setUserBookingsLoading(true);
    // Try to fetch by userId, fallback to email if needed
    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    getDocs(q)
      .then(snap => {
        let bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // If no bookings found by userId, try by email (for legacy data)
        if (bookings.length === 0 && user.email) {
          const q2 = query(collection(db, 'bookings'), where('email', '==', user.email));
          getDocs(q2).then(snap2 => {
            bookings = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserBookings(bookings);
            setUserBookingsLoading(false);
          });
        } else {
          setUserBookings(bookings);
          setUserBookingsLoading(false);
        }
      })
      .catch(() => setUserBookingsLoading(false));
  }, [user]);

  // Generate PDF ticket
  const generateTicketPDF = async (booking: any) => {
    try {
      // Create a temporary div for the ticket
      const ticketDiv = document.createElement('div');
      ticketDiv.style.width = '800px';
      ticketDiv.style.padding = '40px';
      ticketDiv.style.backgroundColor = 'white';
      ticketDiv.style.fontFamily = 'Arial, sans-serif';
      ticketDiv.style.position = 'absolute';
      ticketDiv.style.left = '-9999px';
      ticketDiv.innerHTML = `
        <div style="border: 3px solid #1f2937; border-radius: 15px; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1f2937; padding-bottom: 20px;">
            <div style="font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">🚌 Track My Bus</div>
            <div style="font-size: 18px; color: #6b7280; font-weight: 600;">ELECTRONIC TICKET</div>
          </div>
          
          <!-- Ticket Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">PASSENGER NAME</div>
              <div style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">${booking.username || 'N/A'}</div>
              
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">EMAIL</div>
              <div style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">${booking.email || 'N/A'}</div>
              
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">BOOKING DATE</div>
              <div style="font-size: 16px; color: #1f2937; margin-bottom: 20px;">${booking.bookingDate ? new Date(booking.bookingDate.seconds ? booking.bookingDate.seconds * 1000 : booking.bookingDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            
            <div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">TICKET STATUS</div>
              <div style="font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 20px; text-transform: uppercase;">${booking.status || 'CONFIRMED'}</div>
              
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">TICKET ID</div>
              <div style="font-size: 16px; font-family: monospace; color: #1f2937; margin-bottom: 20px;">${booking.id}</div>
            </div>
          </div>
          
          <!-- Journey Details -->
          <div style="background: #1f2937; color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 20px; text-align: center;">JOURNEY DETAILS</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">ROUTE</div>
                <div style="font-size: 18px; font-weight: bold;">${booking.route || 'N/A'}</div>
              </div>
              <div>
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">BUS</div>
                <div style="font-size: 18px; font-weight: bold;">${booking.busName || 'N/A'}</div>
              </div>
              <div>
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">SEAT NUMBER</div>
                <div style="font-size: 18px; font-weight: bold;">${booking.seat || 'N/A'}</div>
              </div>
              <div>
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">DEPARTURE TIME</div>
                <div style="font-size: 18px; font-weight: bold;">${booking.timing || 'N/A'}</div>
              </div>
              <div>
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">CREDITS EARNED</div>
                <div style="font-size: 18px; font-weight: bold; color: #10b981;">💰 +${booking.creditsEarned || 0}</div>
              </div>
            </div>
          </div>
          
          <!-- Travel Date -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">TRAVEL DATE</div>
            <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${booking.date ? new Date(booking.date.seconds ? booking.date.seconds * 1000 : booking.date).toLocaleDateString() : 'N/A'}</div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; border-top: 2px solid #1f2937; padding-top: 20px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">This is an electronic ticket. Please present this ticket to the bus conductor.</div>
            <div style="font-size: 12px; color: #6b7280;">Generated on ${new Date().toLocaleString()}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(ticketDiv);
      
      // Convert to canvas
      const canvas = await html2canvas(ticketDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove the temporary div
      document.body.removeChild(ticketDiv);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the image
      const x = 10;
      const y = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // Download the PDF
      const fileName = `ticket_${booking.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setToast({ type: 'success', message: 'Ticket downloaded successfully!' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToast({ type: 'error', message: 'Failed to generate ticket. Please try again.' });
    }
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
          <aside className="w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-shrink-0 hidden md:flex flex-col py-8 px-4 rounded-l-lg shadow-lg">
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
          <main className="flex-1 p-4 md:p-12 bg-transparent md:bg-white dark:md:bg-gray-900 rounded-r-lg shadow-lg md:ml-0 mt-0 md:mt-8 text-gray-900 dark:text-white">
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
                          <th className="px-4 py-2">Credits</th>
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
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-600 font-bold">💰</span>
                                <span className="font-mono">{u.credits || 0}</span>
                                <button 
                                  onClick={() => {
                                    const newCredits = (u.credits || 0) + 50;
                                    updateDoc(doc(db, 'users', u.id), { credits: newCredits });
                                    setAllUsers(users => users.map(user => 
                                      user.id === u.id ? { ...user, credits: newCredits } : user
                                    ));
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                  title="Add 50 credits"
                                >
                                  +50
                                </button>
                              </div>
                            </td>
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
                        {allUsers.length === 0 && <tr><td colSpan={6} className="text-gray-500 dark:text-gray-400 px-4 py-2">No users found. (Check Firestore 'users' collection and field names.)</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            {adminTab === 'bookings' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Bookings Management</h2>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bookings.length}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Bookings</div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Confirmed</div>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {bookings.filter(b => b.status === 'upcoming').length}
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">Upcoming</div>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {bookings.filter(b => b.status === 'cancelled').length}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">Cancelled</div>
                  </div>
                </div>

                {bookingsLoading ? (
                  <div className="text-gray-500 dark:text-gray-400">Loading bookings...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <thead>
                        <tr className="text-left">
                          <th className="px-4 py-2">User</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Route</th>
                          <th className="px-4 py-2">Bus</th>
                          <th className="px-4 py-2">Seat</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Credits Earned</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id} className="border-t border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-4 py-2 font-semibold">{b.username || '-'}</td>
                            <td className="px-4 py-2">{b.email || '-'}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                                {b.route || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-medium">{b.busName || '-'}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-sm font-mono">
                                {b.seat || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {b.date ? (
                                typeof b.date === 'string' ? 
                                  new Date(b.date).toLocaleString() : 
                                  (b.date.seconds ? new Date(b.date.seconds * 1000).toLocaleString() : '-')
                              ) : '-'}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <span className="text-green-600 font-bold">💰</span>
                                <span className="font-mono text-sm">+{b.creditsEarned || 0}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                b.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                b.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                b.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {b.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    // Update booking status
                                    updateDoc(doc(db, 'bookings', b.id), {
                                      status: b.status === 'confirmed' ? 'cancelled' : 'confirmed'
                                    }).then(() => {
                                      // Refresh bookings
                                      getDocs(collection(db, 'bookings')).then(snap => {
                                        const updatedBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                        setBookings(updatedBookings);
                                      });
                                    });
                                  }}
                                  className={`px-2 py-1 rounded text-xs ${
                                    b.status === 'confirmed' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                  } text-white`}
                                >
                                  {b.status === 'confirmed' ? 'Cancel' : 'Confirm'}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this booking?')) {
                                      deleteDoc(doc(db, 'bookings', b.id)).then(() => {
                                        // Refresh bookings
                                        getDocs(collection(db, 'bookings')).then(snap => {
                                          const updatedBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                          setBookings(updatedBookings);
                                        });
                                      });
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-gray-500 dark:text-gray-400 px-4 py-8 text-center">
                              No bookings found. Bookings will appear here when users make reservations.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            {adminTab === 'buses' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Buses</h2>
                {/* Add Bus Form */}
                <form className="mb-6 flex flex-col md:flex-row gap-4 items-end" onSubmit={async e => {
                  e.preventDefault();
                  if (!newBus.name || !newBus.start || !newBus.end || !newBus.capacity) return;
                  const busDoc = await addDoc(collection(db, 'buses'), {
                    name: newBus.name,
                    start: newBus.start,
                    end: newBus.end,
                    capacity: Number(newBus.capacity),
                    accessible: newBus.accessible,
                    createdAt: serverTimestamp(),
                  });
                  setNewBus({ name: '', start: '', end: '', capacity: '', accessible: false });
                  setBusesLoading(true);
                  const snap = await getDocs(collection(db, 'buses'));
                  const buses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  setBuses(buses);
                  setBusesLoading(false);
                }}>
                  <input type="text" placeholder="Bus Name/Number" className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={newBus.name} onChange={e => setNewBus({ ...newBus, name: e.target.value })} required title="Bus name/number" />
                  <input type="text" placeholder="Start Location" className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={newBus.start} onChange={e => setNewBus({ ...newBus, start: e.target.value })} required title="Start location" />
                  <input type="text" placeholder="End Location" className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={newBus.end} onChange={e => setNewBus({ ...newBus, end: e.target.value })} required title="End location" />
                  <input type="number" placeholder="Capacity" className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={newBus.capacity} onChange={e => setNewBus({ ...newBus, capacity: e.target.value })} required min={1} title="Bus capacity" />
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={newBus.accessible} onChange={e => setNewBus({ ...newBus, accessible: e.target.checked })} /> Wheelchair Accessible
                  </label>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Bus</button>
                </form>
                {/* Bus List */}
                {busesLoading ? (
                  <div className="text-gray-500 dark:text-gray-400">Loading buses...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <thead>
                        <tr className="text-left">
                          <th className="px-4 py-2">Name/Number</th>
                          <th className="px-4 py-2">Start</th>
                          <th className="px-4 py-2">End</th>
                          <th className="px-4 py-2">Capacity</th>
                          <th className="px-4 py-2">Accessible</th>
                          <th className="px-4 py-2">Timings</th>
                          <th className="px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buses.map(bus => (
                          <React.Fragment key={bus.id}>
                            <tr className="border-t border-gray-300 dark:border-gray-600">
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">{bus.name}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">{bus.start}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">{bus.end}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">{bus.capacity}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">{bus.accessible ? 'Yes' : 'No'}</td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">
                                <div className="space-y-2">
                                  {(timingsMap[bus.id] || []).map(timing => (
                                    <div key={timing.id} className="flex items-center gap-2">
                                      <span>{timing.time}</span>
                                      <span className="text-xs text-gray-500">Seats: {timing.availableSeats}</span>
                                      <button onClick={() => setEditTiming({ busId: bus.id, timingId: timing.id, time: timing.time, availableSeats: timing.availableSeats })} className="px-1 py-0.5 bg-yellow-500 text-white rounded text-xs">Edit</button>
                                      <button onClick={async () => {
                                        if (!window.confirm('Delete this timing?')) return;
                                        await deleteDoc(doc(db, 'buses', bus.id, 'timings', timing.id));
                                        const timingsSnap = await getDocs(collection(db, 'buses', bus.id, 'timings'));
                                        setTimingsMap(prev => ({ ...prev, [bus.id]: timingsSnap.docs.map(t => ({ id: t.id, ...t.data() })) }));
                                      }} className="px-1 py-0.5 bg-red-600 text-white rounded text-xs">Delete</button>
                                      {editTiming && editTiming.busId === bus.id && editTiming.timingId === timing.id && (
                                        <form className="flex gap-2 mt-1" onSubmit={async e => {
                                          e.preventDefault();
                                          await updateDoc(doc(db, 'buses', bus.id, 'timings', timing.id), {
                                            time: editTiming.time,
                                            availableSeats: Number(editTiming.availableSeats),
                                          });
                                          const timingsSnap = await getDocs(collection(db, 'buses', bus.id, 'timings'));
                                          setTimingsMap(prev => ({ ...prev, [bus.id]: timingsSnap.docs.map(t => ({ id: t.id, ...t.data() })) }));
                                          setEditTiming(null);
                                        }}>
                                          <input type="text" value={editTiming.time} onChange={e => setEditTiming(et => et ? { ...et, time: e.target.value } : null)} className="px-2 py-1 rounded border w-24 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" required title="Edit timing time" placeholder="Time (e.g. 10:00)" />
                                          <input type="number" value={editTiming.availableSeats} onChange={e => setEditTiming(et => et ? { ...et, availableSeats: e.target.value } : null)} className="px-2 py-1 rounded border w-16 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" required min={1} title="Edit available seats" placeholder="Seats" />
                                          <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded">Save</button>
                                          <button type="button" onClick={() => setEditTiming(null)} className="px-2 py-1 bg-gray-400 text-white rounded">Cancel</button>
                                        </form>
                                      )}
                                    </div>
                                  ))}
          </div>
                              </td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">
                                <button
                                  className="px-2 py-1 bg-blue-600 text-white rounded mt-2"
                                  onClick={() => setAddTimingBusId(bus.id)}
                                  style={{ display: addTimingBusId === bus.id ? 'none' : 'inline-block' }}
                                >
                                  Add Timing
                                </button>
                                {addTimingBusId === bus.id && (
                                  <form className="flex gap-2 mt-2" onSubmit={async e => {
                                    e.preventDefault();
                                    const { time = '', availableSeats = '' } = timingInputs[bus.id] || {};
                                    if (!time || !availableSeats) return;
                                    await addDoc(collection(db, 'buses', bus.id, 'timings'), {
                                      time,
                                      availableSeats: Number(availableSeats),
                                    });
                                    // Refresh timings
                                    const timingsSnap = await getDocs(collection(db, 'buses', bus.id, 'timings'));
                                    setTimingsMap(prev => ({ ...prev, [bus.id]: timingsSnap.docs.map(t => ({ id: t.id, ...t.data() })) }));
                                    setTimingInputs(prev => ({ ...prev, [bus.id]: { time: '', availableSeats: '' } }));
                                    setAddTimingBusId(null);
                                  }}>
                                    <input
                                      type="text"
                                      placeholder="Time (e.g. 10:00)"
                                      title="Timing time"
                                      className="px-2 py-1 rounded border w-24 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                                      value={timingInputs[bus.id]?.time || ''}
                                      onChange={e => setTimingInputs(prev => ({ ...prev, [bus.id]: { ...prev[bus.id], time: e.target.value } }))}
                                      required
                                    />
                                    <input
                                      type="number"
                                      placeholder="Seats"
                                      title="Available seats"
                                      className="px-2 py-1 rounded border w-16 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                                      value={timingInputs[bus.id]?.availableSeats || ''}
                                      onChange={e => setTimingInputs(prev => ({ ...prev, [bus.id]: { ...prev[bus.id], availableSeats: e.target.value } }))}
                                      required
                                      min={1}
                                    />
                                    <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded">Add</button>
                                    <button type="button" className="px-2 py-1 bg-gray-400 text-white rounded" onClick={() => { setAddTimingBusId(null); setTimingInputs(prev => ({ ...prev, [bus.id]: { time: '', availableSeats: '' } })); }}>Cancel</button>
                                  </form>
                                )}
                              </td>
                              <td className="px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800">
                                <button onClick={() => { setEditBusId(bus.id); setEditBus(bus); }} className="px-2 py-1 bg-yellow-500 text-white rounded mr-2">Edit</button>
                                <button onClick={async () => {
                                  if (!window.confirm('Delete this bus and all its timings?')) return;
                                  const timingsSnap = await getDocs(collection(db, 'buses', bus.id, 'timings'));
                                  await Promise.all(timingsSnap.docs.map(t => deleteDoc(doc(db, 'buses', bus.id, 'timings', t.id))));
                                  await deleteDoc(doc(db, 'buses', bus.id));
                                  setBuses(buses => buses.filter(b => b.id !== bus.id));
                                }} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                              </td>
                            </tr>
                            {editBusId === bus.id && (
                              <tr>
                                <td colSpan={7}>
                                  <form className="flex gap-2" onSubmit={async e => {
                                    e.preventDefault();
                                    await updateDoc(doc(db, 'buses', bus.id), {
                                      name: editBus.name,
                                      start: editBus.start,
                                      end: editBus.end,
                                      capacity: Number(editBus.capacity),
                                      accessible: editBus.accessible,
                                    });
                                    setEditBusId(null);
                                    setEditBus(null);
                                    setBusesLoading(true);
                                    const snap = await getDocs(collection(db, 'buses'));
                                    setBuses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                                    setBusesLoading(false);
                                  }}>
                                    <input type="text" value={editBus.name} onChange={e => setEditBus({ ...editBus, name: e.target.value })} className="px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" required title="Bus name/number" placeholder="Bus Name/Number" />
                                    <input type="text" value={editBus.start} onChange={e => setEditBus({ ...editBus, start: e.target.value })} className="px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" required title="Start location" placeholder="Start Location" />
                                    <input type="text" value={editBus.end} onChange={e => setEditBus({ ...editBus, end: e.target.value })} className="px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" required title="End location" placeholder="End Location" />
                                    <input type="number" value={editBus.capacity} onChange={e => setEditBus({ ...editBus, capacity: e.target.value })} className="px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" required min={1} title="Bus capacity" placeholder="Capacity" />
                                    <label className="flex items-center gap-2">
                                      <input type="checkbox" checked={editBus.accessible} onChange={e => setEditBus({ ...editBus, accessible: e.target.checked })} /> Accessible
                                    </label>
                                    <button type="submit" className="px-2 py-1 bg-green-600 text-white rounded">Save</button>
                                    <button type="button" onClick={() => { setEditBusId(null); setEditBus(null); }} className="px-2 py-1 bg-gray-400 text-white rounded">Cancel</button>
                                  </form>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        {buses.length === 0 && <tr><td colSpan={7} className="text-gray-500 dark:text-gray-400 px-4 py-2">No buses found.</td></tr>}
                      </tbody>
                    </table>
          </div>
                )}
                {/* Wheelchair accessibility summary below the table */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Wheelchair Accessibility</h3>
                  <ul className="space-y-2">
                    {buses.map(bus => (
                      <li key={bus.id} className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <span className="font-medium">Bus {bus.name}:</span>
                        {bus.accessible ? (
                          <span className="flex items-center text-green-600 dark:text-green-400"><svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Wheelchair Accessible</span>
                        ) : (
                          <span className="flex items-center text-red-600 dark:text-red-400"><svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Not Wheelchair Accessible</span>
                        )}
                      </li>
                    ))}
                  </ul>
        </div>
              </>
            )}
            {adminTab === 'settings' && (
              <>
                <h2 className="text-3xl font-bold mb-6">Admin Settings</h2>
                
                {/* Admin Setup */}
                <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-200">Admin Setup</h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    If you're not seeing bookings, you may need to set up admin access. Click the button below to create your admin account.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={async () => {
                        try {
                          await setDoc(doc(db, 'admin', user.uid), {
                            email: user.email,
                            uid: user.uid,
                            username: user.displayName || 'Admin',
                            createdAt: serverTimestamp(),
                            role: 'admin'
                          });
                          setToast({ type: 'success', message: 'Admin access granted! Please refresh the page.' });
                          // Refresh admin status
                          const q = query(collection(db, 'admin'), where('email', '==', user.email));
                          const snapshot = await getDocs(q);
                          if (!snapshot.empty) {
                            setRole('admin');
                          }
                        } catch (error) {
                          setToast({ type: 'error', message: 'Failed to create admin access. Please try again.' });
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Setup Admin Access
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                          // Create a test booking
                          await addDoc(collection(db, 'bookings'), {
                            userId: user.uid,
                            username: user.displayName || 'Test User',
                            email: user.email,
                            route: 'Test Route → Test Destination',
                            busName: 'Test Bus 101',
                            seat: 'A1',
                            date: new Date(),
                            status: 'confirmed',
                            busId: 'test-bus-1',
                            timingId: 'test-timing-1',
                            timing: '10:00 AM',
                            bookingDate: new Date()
                          });
                          setToast({ type: 'success', message: 'Test booking created! Check the Bookings tab.' });
                          // Refresh bookings
                          const snap = await getDocs(collection(db, 'bookings'));
                          const updatedBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                          setBookings(updatedBookings);
                        } catch (error) {
                          setToast({ type: 'error', message: 'Failed to create test booking. Please try again.' });
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Create Test Booking
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                          // Create multiple test bookings
                          const testBookings = [
                            {
                              userId: user.uid,
                              username: 'John Doe',
                              email: 'john@example.com',
                              route: 'City Center → Airport',
                              busName: 'B101',
                              seat: '12A',
                              date: new Date(),
                              status: 'confirmed',
                              busId: 'bus1',
                              timingId: 'timing1',
                              timing: '09:00 AM',
                              bookingDate: new Date()
                            },
                            {
                              userId: user.uid,
                              username: 'Jane Smith',
                              email: 'jane@example.com',
                              route: 'Downtown → University',
                              busName: 'B205',
                              seat: '7B',
                              date: new Date(),
                              status: 'upcoming',
                              busId: 'bus2',
                              timingId: 'timing2',
                              timing: '02:30 PM',
                              bookingDate: new Date()
                            },
                            {
                              userId: user.uid,
                              username: 'Mike Johnson',
                              email: 'mike@example.com',
                              route: 'Mall → Residential',
                              busName: 'B312',
                              seat: '3C',
                              date: new Date(),
                              status: 'cancelled',
                              busId: 'bus3',
                              timingId: 'timing3',
                              timing: '06:00 PM',
                              bookingDate: new Date()
                            }
                          ];
                          
                          // Create all test bookings
                          for (const booking of testBookings) {
                            await addDoc(collection(db, 'bookings'), booking);
                          }
                          
                          setToast({ type: 'success', message: 'Multiple test bookings created! Check the Bookings tab.' });
                          // Refresh bookings
                          const snap = await getDocs(collection(db, 'bookings'));
                          const updatedBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                          setBookings(updatedBookings);
                        } catch (error) {
                          setToast({ type: 'error', message: 'Failed to create test bookings. Please try again.' });
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Create Multiple Test Bookings
                    </button>
                  </div>
                </div>

                {/* Admin Status */}
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-800 dark:text-green-200">Admin Access Active</span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 mt-1">You have full administrative privileges.</p>
                </div>

                <div className="text-gray-700 dark:text-gray-200 mb-4">
                  <p className="mb-2"><strong>Current Status:</strong> {role === 'admin' ? 'Admin' : 'User'}</p>
                  <p className="mb-2"><strong>Email:</strong> {user.email}</p>
                  <p className="mb-2"><strong>User ID:</strong> {user.uid}</p>
                </div>

                {/* Admin Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Admin Account</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin ID</label>
                        <p className="text-gray-900 dark:text-white font-mono text-sm">{user.uid}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Status</label>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Database Access</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Users Collection</span>
                        <span className="text-green-600 dark:text-green-400">✓ Read/Write</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Bookings Collection</span>
                        <span className="text-green-600 dark:text-green-400">✓ Read/Write</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Buses Collection</span>
                        <span className="text-green-600 dark:text-green-400">✓ Read/Write</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Admin Collection</span>
                        <span className="text-green-600 dark:text-green-400">✓ Read</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setAdminTab('users')}
                      className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                      <div className="font-semibold text-blue-800 dark:text-blue-200">Manage Users</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">View and manage user accounts</div>
                    </button>
                    
                    <button 
                      onClick={() => setAdminTab('bookings')}
                      className="p-4 bg-green-100 dark:bg-green-900 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    >
                      <Activity className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                      <div className="font-semibold text-green-800 dark:text-green-200">Manage Bookings</div>
                      <div className="text-sm text-green-600 dark:text-green-400">View and manage all bookings</div>
                    </button>
                    
                    <button 
                      onClick={() => setAdminTab('buses')}
                      className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                      <Edit3 className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                      <div className="font-semibold text-purple-800 dark:text-purple-200">Manage Buses</div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">Add and manage bus routes</div>
                    </button>
                  </div>
                </div>
              </>
            )}
            <button onClick={() => { signOut(); navigate('/'); }} className="mt-8 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"><LogOut className="h-4 w-4 mr-1" />Sign Out</button>
          </main>
          {role === 'admin' && showAIPanel && (
            <div className="fixed right-4 top-8 w-[420px] max-w-full z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              <button
                className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-xl font-bold focus:outline-none"
                onClick={() => setShowAIPanel(false)}
                title="Close AI Assistant"
                aria-label="Close AI Assistant"
              >
                ×
              </button>
              <AssistantPage />
        </div>
          )}
          {role === 'admin' && !showAIPanel && (
        <button
              className="fixed right-6 bottom-6 z-50 bg-blue-600 dark:bg-blue-700 text-white rounded-full shadow-lg p-4 hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none"
              onClick={() => setShowAIPanel(true)}
              title="Open AI Assistant"
              aria-label="Open AI Assistant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm0 0c0-1.657-1.343-3-3-3s-3 1.343-3 3 1.343 3 3 3 3-1.343 3-3zm0 0v2m0 4h.01" /></svg>
        </button>
          )}
        </div>
      );
    }
    if (profileLoading) {
      return <div className="flex justify-center items-center min-h-[60vh] text-lg">Loading profile...</div>;
    }
    return (
      <div className="flex min-h-[80vh]">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-shrink-0 hidden md:flex flex-col py-8 px-4 rounded-l-lg shadow-lg">
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
        <main className="flex-1 p-4 md:p-12 bg-transparent md:bg-white dark:md:bg-gray-900 rounded-r-lg shadow-lg md:ml-0 mt-0 md:mt-8 text-gray-900 dark:text-white">
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
                  
                  {/* Credit System Display */}
                  <div className="flex items-center gap-4 mt-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">💰</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Credits</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{userCredits}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Earn credits by booking tickets!
                    </div>
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
                    <input id="edit-username" type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={editUsername} onChange={e => setEditUsername(e.target.value)} required title="Edit your username" placeholder="Username" />
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
              
              {/* Booking Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userBookings.length}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Bookings</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userBookings.filter(b => b.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Confirmed</div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {userBookings.filter(b => b.status === 'upcoming').length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Upcoming</div>
                </div>
                <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {userBookings.filter(b => b.status === 'cancelled').length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Cancelled</div>
                </div>
              </div>

              <div className="grid gap-4">
                {userBookingsLoading ? (
                  <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading bookings...
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">No bookings found</div>
                    <div className="text-gray-400 dark:text-gray-500 text-sm">Book a ticket to see your bookings here</div>
                  </div>
                ) : (
                  userBookings.map(b => (
                    <div key={b.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold text-lg text-gray-900 dark:text-white">{b.route}</div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              b.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              b.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              b.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : 'Pending'}
                            </span>
                      </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div><span className="font-medium">Date:</span> {b.date ? (typeof b.date === 'string' ? new Date(b.date).toLocaleString() : (b.date.seconds ? new Date(b.date.seconds * 1000).toLocaleString() : '-')) : '-'}</div>
                            <div><span className="font-medium">Bus:</span> {b.busName || '-'}</div>
                            <div><span className="font-medium">Seat:</span> <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{b.seat || '-'}</span></div>
                            <div><span className="font-medium">Timing:</span> {b.timing || '-'}</div>
                            <div><span className="font-medium">Credits Earned:</span> <span className="flex items-center gap-1"><span className="text-green-600 font-bold">💰</span><span className="font-mono">+{b.creditsEarned || 0}</span></span></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {b.status === 'upcoming' && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to cancel this booking? This will also remove the credits earned from this booking.')) {
                                                                      try {
                                      console.log('Cancelling booking:', b.id);
                                      console.log('Booking data:', b);
                                      console.log('User ID:', user.uid);
                                      
                                      // Update booking status to cancelled
                                      await updateDoc(doc(db, 'bookings', b.id), {
                                        status: 'cancelled',
                                        cancelledAt: new Date()
                                      });
                                    
                                    console.log('Booking status updated to cancelled');
                                    
                                    // Remove credits earned from this booking
                                    const creditsToRemove = b.creditsEarned || 0;
                                    console.log('Credits to remove:', creditsToRemove);
                                    
                                    if (creditsToRemove > 0) {
                                      const userDoc = await getDoc(doc(db, 'users', user.uid));
                                      if (userDoc.exists()) {
                                        const userData = userDoc.data();
                                        const currentCredits = userData?.credits || 0;
                                        const newCredits = Math.max(0, currentCredits - creditsToRemove);
                                        
                                        console.log('Updating user credits:', currentCredits, '->', newCredits);
                                        
                                        await updateDoc(doc(db, 'users', user.uid), {
                                          credits: newCredits
                                        });
                                        
                                        // Update local state
                                        setUserCredits(newCredits);
                                        setProfile((prev: any) => ({ ...prev, credits: newCredits }));
                                      }
                                    }
                                    
                                    setToast({ type: 'success', message: `Booking cancelled successfully! ${creditsToRemove > 0 ? `${creditsToRemove} credits removed.` : ''}` });
                                    
                                    // Refresh user bookings
                                    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
                                    const snap = await getDocs(q);
                                    const updatedBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                    setUserBookings(updatedBookings);
                                  } catch (error) {
                                    console.error('Error cancelling booking:', error);
                                    setToast({ type: 'error', message: `Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}` });
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                            >
                              Cancel Booking
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => generateTicketPDF(b)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                              >
                                View Ticket
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to cancel this confirmed booking? This will also remove the credits earned from this booking.')) {
                                    try {
                                      console.log('Cancelling confirmed booking:', b.id);
                                      console.log('Confirmed booking data:', b);
                                      console.log('User ID:', user.uid);
                                      
                                      // Update booking status to cancelled
                                      await updateDoc(doc(db, 'bookings', b.id), {
                                        status: 'cancelled',
                                        cancelledAt: new Date()
                                      });
                                      
                                      console.log('Confirmed booking status updated to cancelled');
                                      
                                      // Remove credits earned from this booking
                                      const creditsToRemove = b.creditsEarned || 0;
                                      console.log('Credits to remove from confirmed booking:', creditsToRemove);
                                      
                                      if (creditsToRemove > 0) {
                                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                                        if (userDoc.exists()) {
                                          const userData = userDoc.data();
                                          const currentCredits = userData?.credits || 0;
                                          const newCredits = Math.max(0, currentCredits - creditsToRemove);
                                          
                                          console.log('Updating user credits from confirmed booking:', currentCredits, '->', newCredits);
                                          
                                          await updateDoc(doc(db, 'users', user.uid), {
                                            credits: newCredits
                                          });
                                          
                                          // Update local state
                                          setUserCredits(newCredits);
                                          setProfile((prev: any) => ({ ...prev, credits: newCredits }));
                                        }
                                      }
                                      
                                      setToast({ type: 'success', message: `Booking cancelled successfully! ${creditsToRemove > 0 ? `${creditsToRemove} credits removed.` : ''}` });
                                      
                                      // Refresh user bookings
                                      const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
                                      const snap = await getDocs(q);
                                      const updatedBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                      setUserBookings(updatedBookings);
                                    } catch (error) {
                                      console.error('Error cancelling confirmed booking:', error);
                                      setToast({ type: 'error', message: `Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}` });
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                              >
                                Cancel Booking
                              </button>
                            </div>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-sm font-medium">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
            className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            value={signInEmail}
            onChange={e => setSignInEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
          
          {/* Debug button for testing */}
          <button
            type="button"
            onClick={createTestUser}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Create Test User
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
            className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
            className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
            className="px-3 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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