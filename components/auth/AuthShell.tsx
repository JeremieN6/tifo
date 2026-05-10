import Link from 'next/link';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-[#020f07] pitch-lines">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-4xl uppercase tracking-tight">
            <span className="text-white">TI</span>
            <span className="text-green-500">FO</span>
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-green-900/30 bg-green-950/10 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
