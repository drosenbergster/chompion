import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chompion",
  description: "Who's your Chompion? The easy way to track, rate, and rank your favorite eats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
