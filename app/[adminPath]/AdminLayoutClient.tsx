'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface AdminLayoutClientProps {
  adminPath: string;
  adminEmail: string;
  totpEnabled: boolean;
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  adminPath,
  adminEmail,
  totpEnabled,
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname.endsWith('/login') || pathname.endsWith('/login/');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__IS_ADMIN_PORTAL__ = true;
      document.documentElement.dataset.admin = 'true';
    }
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const basePath = `/${adminPath}`;

  const navItems = [
    { label: 'Dashboard', href: basePath, icon: '📊' },
    { label: 'Orders', href: `${basePath}/orders`, icon: '📦' },
    { label: 'Products', href: `${basePath}/products`, icon: '🧴' },
    { label: 'Coupons', href: `${basePath}/coupons`, icon: '🏷️' },
    { label: 'Offers', href: `${basePath}/offers`, icon: '🎁' },
    { label: 'Content', href: `${basePath}/content`, icon: '📝' },
    { label: 'Reviews', href: `${basePath}/reviews`, icon: '⭐' },
    { label: 'Settings', href: `${basePath}/settings`, icon: '⚙️' },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push(`${basePath}/login`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-[#121212] flex">
      {/* Fixed Left Sidebar (240px) */}
      <aside className="w-60 bg-[#553E23] text-[#FFF8EC] flex flex-col fixed inset-y-0 left-0 z-30 shadow-xl border-r border-[#E8DCC8]/20">
        <div className="h-20 flex items-center px-6 border-b border-[#FFF8EC]/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#553E23] font-bold font-serif text-lg">
              ع
            </div>
            <div>
              <div className="font-serif font-bold text-lg tracking-wider text-white">AL UMAR</div>
              <div className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive =
              item.href === basePath
                ? pathname === basePath || pathname === `${basePath}/`
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#1E6B5C] text-white shadow-md'
                    : 'text-[#FFF8EC]/80 hover:bg-[#FFF8EC]/10 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Security & 2FA Section in Sidebar */}
          <div className="pt-6 mt-6 border-t border-[#FFF8EC]/10 px-2">
            <div className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2.5">
              Security
            </div>
            <Link
              href={`${basePath}/settings/2fa`}
              className={`block p-3 rounded-lg border transition ${
                totpEnabled
                  ? 'bg-[#1E6B5C]/20 border-[#1E6B5C]/40 text-[#A3E6D2]'
                  : 'bg-[#BA3D3D]/20 border-[#BA3D3D]/40 text-[#FFBDBD]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>2FA Status</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-bold bg-black/30">
                  {totpEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="text-[11px] text-[#FFF8EC]/70 mt-1">
                {totpEnabled ? 'TOTP Authenticator active' : 'Click to enable 2FA protection'}
              </div>
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#FFF8EC]/10 text-xs text-[#FFF8EC]/60 text-center">
          Encrypted Admin Session • 256-bit
        </div>
      </aside>

      {/* Main Body with Left Margin for Fixed Sidebar */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E8DCC8] px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#7A5B37] font-semibold tracking-wide uppercase bg-[#FFF8EC] px-3 py-1 rounded-full border border-[#E8DCC8]">
              Environment: Production
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-xs font-bold text-[#121212]">{adminEmail}</div>
              <div className="text-[11px] text-[#1E6B5C] font-semibold">Authorized Administrator</div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-[#FFF8EC] hover:bg-[#F2E8D7] text-[#BA3D3D] border border-[#E8DCC8] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 bg-[#FFF8EC]">
          {children}
        </main>
      </div>
    </div>
  );
}
