import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Work Diary",
  description:
    "Orchestrator reviewer and summarizer for Jira, Bitbucket, and work activities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
