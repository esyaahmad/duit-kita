import NavBawah from "@/components/NavBawah";
import KunciApp from "@/components/KunciApp";

export default function AppLayout({ children }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md">
      <main className="px-4 pb-32 pt-6">{children}</main>
      <NavBawah />
      <KunciApp />
    </div>
  );
}
