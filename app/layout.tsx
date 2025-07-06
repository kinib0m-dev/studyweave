import type { Metadata } from "next";
import { Sora, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/AuthProvider";
import { TRPCProvider } from "@/trpc/client";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://studyweave.com"),
  title: {
    default: "StudyWeave",
    template: `%s | StudyWeave`,
  },
  description:
    "StudyWeave is your AI-powered learning companion. Upload notes, slides, and past exams to generate concept maps, flashcards, quizzes, and audio explanations—all in one beautiful, intuitive app.",
  keywords: [
    "StudyWeave",
    "AI study app",
    "concept maps",
    "flashcards",
    "quiz generator",
    "exam preparation",
    "study companion",
    "AI tutor",
    "learning assistant",
    "educational technology",
  ],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "StudyWeave",
    description:
      "Your AI learning companion. Turn your study materials into concept maps, quizzes, and audio lessons with StudyWeave.",
    images: ["https://studyweave.com/og-image.png"],
    url: "https://studyweave.com",
    siteName: "StudyWeave",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyWeave",
    description:
      "Your AI-powered learning companion. Upload notes and get concept maps, flashcards, quizzes, and audio explanations.",
    images: ["https://studyweave.com/og-image.png"],
    site: "@studyweave",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <AuthProvider session={session}>
      <html lang="en">
        <body
          className={`${sora.variable} ${sourceSans3.variable} antialiased min-h-screen flex flex-col`}
        >
          <TRPCProvider>
            <main>{children}</main>
            <Toaster richColors closeButton />
          </TRPCProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
