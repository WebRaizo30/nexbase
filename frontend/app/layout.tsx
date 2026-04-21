import type { Metadata } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { CrtEffects } from "@/components/crt-effects";
import { Providers } from "@/components/providers";
import { nexbaseConfig } from "@/lib/nexbase-config";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: nexbaseConfig.appName,
  description: nexbaseConfig.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${jetbrains.variable} min-h-screen font-sans text-foreground antialiased`}
      >
        <Providers>
          <div className="crt-content relative min-h-screen">
            <CrtEffects />
            <div className="relative z-10">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
