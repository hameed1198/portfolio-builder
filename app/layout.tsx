import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Hameed Khan Mohammad | Cinematic Portfolio",
  description:
    "Software Engineer specializing in Python, Full Stack, AWS and GenAI. Cinematic portfolio of Hameed Khan Mohammad.",
  keywords: [
    "Hameed Khan",
    "Software Engineer",
    "Python",
    "FastAPI",
    "AWS",
    "GenAI",
    "Portfolio",
  ],
  authors: [{ name: "Hameed Khan Mohammad" }],
  openGraph: {
    title: "Hameed Khan Mohammad | Cinematic Portfolio",
    description:
      "Software Engineer specializing in Python, Full Stack, AWS and GenAI.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}