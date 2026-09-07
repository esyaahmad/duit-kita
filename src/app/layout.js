import "./globals.css";
import {
  Space_Grotesk, IBM_Plex_Mono, Rajdhani, Nunito, Playfair_Display, Bangers,
} from "next/font/google";

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

// Font khusus tema — tidak di-preload, hanya diambil saat temanya dipakai.
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
  preload: false,
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  preload: false,
});

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

const komik = Bangers({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-komik",
  display: "swap",
  preload: false,
});

const fontVars = [sans, mono, rajdhani, nunito, serif, komik]
  .map((f) => f.variable)
  .join(" ");

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
const temaAwal = `try{var K={kertas:'#ede7d9',malam:'#171613',futuristik:'#070a12',hijau:'#e9f2e0',senja:'#1a1327',samudra:'#e7f1f5',grandline:'#f0dfba'};var t=localStorage.getItem('tema');if(t==='gelap')t='malam';if(t==='terang')t='kertas';if(!t||!K[t])t=matchMedia('(prefers-color-scheme: dark)').matches?'malam':'kertas';var q=(location.search.match(/[?&]tema=([a-z]+)/)||[])[1];if(q&&K[q]){t=q;try{localStorage.setItem('tema',t)}catch(e){}}document.documentElement.setAttribute('data-tema',t);var m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',K[t]);}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaAwal }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
