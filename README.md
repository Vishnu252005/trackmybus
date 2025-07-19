# TrackMyBus

TrackMyBus is a modern web application for real-time bus tracking, route planning, and booking. It provides users with an intuitive interface to view bus locations, book tickets, and manage their journeys efficiently.

## Features
- Real-time bus tracking on an interactive map
- Route planning and viewing
- Online ticket booking
- User-friendly interface with responsive design
- Theming support (light/dark mode)
- Push notifications for bus arrivals and delays *(planned)*
- User profiles and booking history *(planned)*
- Admin dashboard for managing routes and buses *(planned)*
- Analytics and reporting for operators *(planned)*
- Multi-language support *(planned)*
- Accessibility improvements for all users *(planned)*

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS
- **State Management:** React Hooks
- **Build Tools:** Vite

## Getting Started

### Prerequisites
- Node.js (v16 or above recommended)
- npm (v8 or above)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trackmybus.git
   cd trackmybus
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173` by default.

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure
```
trackmybus/
├── src/
│   ├── components/      # Reusable UI components
│   ├── data/            # Mock data for development
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Main application pages
│   ├── types/           # TypeScript type definitions
│   ├── index.css        # Global styles
│   ├── App.tsx          # Root React component
│   └── main.tsx         # Entry point
├── public/              # Static assets (if any)
├── package.json         # Project metadata and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md            # Project documentation
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. 