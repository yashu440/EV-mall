import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'GridWise – AI Smart EV Charging Scheduler',
  description: 'Intelligent EV charging management for shopping malls and retail centers. AI-driven scheduling, real-time monitoring, and smart grid optimization.',
  keywords: 'EV charging, smart grid, AI scheduling, electric vehicle, charging station, mall parking',
  openGraph: {
    title: 'GridWise – AI Smart EV Charging Scheduler',
    description: 'Intelligent EV charging management for shopping malls and retail centers.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0a0f1a" />
      </head>
      <body>
        <div className="grid-pattern" aria-hidden="true" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
