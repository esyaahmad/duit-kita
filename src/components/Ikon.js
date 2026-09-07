// Ikon garis sederhana. Tebal garisnya ikut tema lewat --ikon-w
// (tipis untuk Futuristik, tebal-membulat untuk Go Green, dll).

const JALUR = {
  beranda: <path d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5M9.5 20v-5h5v5" />,
  transaksi: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  anggaran: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.4" />
      <circle cx="8" cy="17" r="2.4" />
    </>
  ),
  lainnya: (
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>
  ),
  tambah: <path d="M12 5v14M5 12h14" />,
  mata: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "mata-tutup": (
    <>
      <path d="M3 4l18 16" />
      <path d="M10.6 6.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 3.9M6.3 7.7A17 17 0 0 0 2 12s3.5 7 10 7a9.4 9.4 0 0 0 4-.9" />
      <path d="M9.5 10.4a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  bagikan: (
    <>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="6" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="M8.3 10.8 15.7 7.2M8.3 13.2l7.4 3.6" />
    </>
  ),
};

export default function Ikon({ nama, size = "1.25em", className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth: "var(--ikon-w, 2)" }}
      aria-hidden="true"
    >
      {JALUR[nama]}
    </svg>
  );
}
