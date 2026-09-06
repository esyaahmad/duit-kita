import "./globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "Duit Kita — buku kas pribadi",
  description:
    "Catat pemasukan, pengeluaran, anggaran, dan target tabungan dari ponsel.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Duit Kita" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#EDE7D9",
};

const temaAwal = `try{var t=localStorage.getItem('tema');if(t==='gelap'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaAwal }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
