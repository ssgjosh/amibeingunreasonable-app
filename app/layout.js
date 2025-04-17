import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Am I Being Unreasonable? - AI Analysis", // Updated title
  description: "Get AI perspectives on your situation.", // Updated description
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Added gradient background, animation, and text color to body */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-r from-background via-secondary/20 to-background text-foreground animate-gradient-xy`}
        style={{ backgroundSize: '200% 200%' }} // Required for gradient animation
      >
        {children}
      </body>
    </html>
  );
}
