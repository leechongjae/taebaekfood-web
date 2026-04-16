import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-sm px-6 py-4">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">태</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">태백식품</h1>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-gray-400 text-sm">
        © 2026 태백식품. All rights reserved.
      </footer>
    </main>
  );
}
