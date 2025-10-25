import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from '../components/ToastProvider';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import LiquidEther from '../components/LiquidEther';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ArguMate - AI-Powered Debate Platform",
  description: "Engage in structured 1v1 debates with AI judging. Improve your argumentation skills and climb the Hype leaderboard.",
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ether-vignette`}
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <ToastProvider />
        <AuthProvider>
          <SocketProvider>
            <LiquidEther
              colors={[ '#3b0a5b', '#581c87', '#7c3aed', '#a855f7', '#ec4899' ]}
              testMode={false}
              mouseForce={18}
              cursorSize={120}
              isViscous={true}
              viscous={36}
              iterationsViscous={40}
              iterationsPoisson={36}
              resolution={0.5}
              isBounce={false}
              autoDemo={true}
              autoSpeed={0.45}
              autoIntensity={2.0}
              takeoverDuration={0.25}
              autoResumeDelay={2800}
              autoRampDuration={0.6}
            />
            <div style={{ position: 'relative', zIndex: 10 }}>
              {children}
            </div>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
