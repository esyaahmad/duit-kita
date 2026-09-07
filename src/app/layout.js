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

// Set tema sebelum paint pertama supaya tidak ada kedipan warna.
const temaAwal = `try{var K={kertas:'#ede7d9',malam:'#171613',futuristik:'#080b14',hijau:'#eef4e8',senja:'#1a1327',samudra:'#e7f1f5'};var t=localStorage.getItem('tema');if(t==='gelap')t='malam';if(t==='terang')t='kertas';if(!t||!K[t])t=matchMedia('(prefers-color-scheme: dark)').matches?'malam':'kertas';document.documentElement.setAttribute('data-tema',t);var m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',K[t]);}catch(e){}`;

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
