import type { Metadata } from "next";
import { Space_Grotesk, Public_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FixCity | The Civic Portal",
  description: "Report infrastructure issues in real-time. Join thousands fixing their communities today.",
  keywords: ["civic", "infrastructure", "report", "pothole", "garbage", "e-waste", "community"],
  authors: [{ name: "FixCity" }],
  openGraph: {
    title: "FixCity | The Civic Portal",
    description: "Report infrastructure issues in real-time. Join thousands fixing their communities today.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${publicSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
