import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import TenantTheme from "@/components/TenantTheme";
import PragmaIA from "@/components/PragmaIA/PragmaIA";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PRAGMA Strategic Management",
  description: "B2B SaaS for Strategy, OKRs, and Performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <LanguageProvider>
          <AuthProvider>
            <TenantTheme />
            <PragmaIA />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
