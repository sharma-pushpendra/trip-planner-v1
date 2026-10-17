import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'TripPilot AI — Go beyond the ordinary', description: 'Real-web travel research. Thoughtful itineraries. Your next adventure, researched by AI.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
