import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/header";
import { APP_VERSION_LABEL } from "@/lib/version";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lehimhane — Elektronik Forum",
  description:
    "Arduino, Raspberry Pi, STM32 ve hobi elektronik topluluğu. Konu aç, paylaş, rütbe kazan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${sourceSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider>
          <Header />
          <main className="shell page flex-1">{children}</main>
          <footer className="shell site-footer">
            <span>Lehimhane — elektronikçiler ve hobiciler için forum.</span>
            <span className="site-version" title="Uygulama sürümü">
              {APP_VERSION_LABEL}
            </span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
