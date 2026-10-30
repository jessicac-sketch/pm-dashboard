import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { ThemeScript } from "@/components/layout/theme-script";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Babaylan",
  description: "Project management dashboard: track projects, people and sprints",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  // data-theme is set by ThemeScript before React hydrates, so React shouldn't flag it as a mismatch.
  <html lang="en" suppressHydrationWarning>
    <head>
      <ThemeScript />
    </head>
    <body className={`${nunito.variable} antialiased`}>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
