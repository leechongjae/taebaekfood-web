import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white/70 backdrop-blur-sm border-b border-stone-200/60 px-6 py-4">
        <Logo />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/70 shadow-sm p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
            {subtitle && <p className="text-stone-500 mt-2 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
