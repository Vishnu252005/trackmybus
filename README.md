# Track My Bus

**Track My Bus** is a modern, real-time bus tracking and booking platform developed by **Team Stellar**. It provides users with an intuitive interface to view live bus locations, book tickets, plan routes, and manage their journeys efficiently.

## 🚌 Features

### ✅ **Currently Implemented**
- **Real-time Bus Tracking**: Live location updates with interactive map visualization
- **Route Planning**: Find optimal routes with distance, duration, and pricing
- **Online Ticket Booking**: Secure booking system with seat selection
- **AI Travel Assistant**: Intelligent chatbot for booking, tracking, and travel queries
- **User Authentication**: Firebase-based user management and profiles
- **Booking Management**: View, track, and cancel bookings with real-time updates
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between dark and light modes for better user experience
- **Multi-language Support**: AI Assistant supports multiple languages including Malayalam
- **Real-time Data**: Live updates from Firestore database
- **Booking Cancellation**: Cancel bookings with credit management
- **Multiple Seat Selection**: Book multiple seats in a single transaction
- **Fuzzy Search**: Auto-correct city names and intelligent route matching

### 🚀 **Advanced Features**
- **Firebase Integration**: Real-time data synchronization with Firestore
- **AI-Powered Booking**: Natural language booking through AI Assistant
- **Live Map Integration**: Interactive maps showing bus locations and routes
- **Credit System**: Earn and manage credits for bookings
- **Accessibility**: WCAG compliant design with proper labels and navigation
- **Performance Optimized**: Fast loading with Vite build system

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive and modern styling
- **React Router** for client-side routing

### **Backend & Services**
- **Firebase Firestore** for real-time database
- **Firebase Authentication** for user management
- **Groq AI** for intelligent travel assistance
- **Vercel** for deployment and hosting

### **Libraries & Tools**
- **Lucide React** for beautiful icons
- **React Hooks** for state management
- **PostCSS** for CSS processing
- **ESLint** for code quality

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or above recommended)
- npm (v8 or above)
- Firebase project setup

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/trackmybus.git
   cd trackmybus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Create a Firebase project
   - Enable Firestore and Authentication
   - Add your Firebase config to `src/firebase/config.ts`

4. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure
```
trackmybus/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BusCard.tsx     # Bus information cards
│   │   ├── LoadingSpinner.tsx # Loading indicators
│   │   ├── MapSimulation.tsx  # Interactive maps
│   │   └── Navbar.tsx      # Navigation component
│   ├── pages/              # Main application pages
│   │   ├── HomePage.tsx    # Landing page
│   │   ├── TrackingPage.tsx # Real-time bus tracking
│   │   ├── RoutePage.tsx   # Route planning
│   │   ├── BookingPage.tsx # Ticket booking
│   │   ├── AssistantPage.tsx # AI travel assistant
│   │   └── ProfilePage.tsx # User profile management
│   ├── hooks/              # Custom React hooks
│   │   └── useTheme.ts     # Theme management
│   ├── types/              # TypeScript definitions
│   ├── firebase/           # Firebase configuration
│   ├── data/               # Mock data for development
│   └── index.css           # Global styles
├── public/                 # Static assets
├── dataconnect/            # Firebase Data Connect
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind configuration
├── vite.config.ts          # Vite build configuration
├── vercel.json             # Vercel deployment config
└── README.md               # Project documentation
```

## 🌟 Team Stellar

**Track My Bus** is proudly developed by **Team Stellar**, a passionate group of developers committed to creating innovative transportation solutions.

### Our Mission
To revolutionize public transportation by providing real-time tracking, intelligent booking systems, and seamless user experiences that make daily commuting efficient and enjoyable.

## 🔧 Key Features Explained

### Real-time Bus Tracking
- Live location updates from Firestore
- Interactive map visualization
- ETA calculations and distance tracking
- Bus status monitoring (on-time, delayed, early)

### AI Travel Assistant
- Natural language booking queries
- Auto-correct for city names
- Real-time booking information
- Multi-language support
- Booking cancellation through chat

### Smart Booking System
- Multiple seat selection
- Real-time seat availability
- Credit-based booking system
- Booking history and management
- Special needs accommodation

## 🚀 Deployment

The application is deployed on **Vercel** with the following features:
- Automatic deployments from Git
- Custom domain support
- SSL certificate
- CDN for fast global access
- Environment variable management

## 🤝 Contributing

We welcome contributions from the community! Please feel free to:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Add proper error handling
- Include accessibility features
- Test on multiple devices

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, feature requests, or bug reports, please:
- Open an issue on GitHub
- Contact Team Stellar
- Check our documentation

---

**Track My Bus** - Making public transportation smarter, one journey at a time. 🚌✨ 