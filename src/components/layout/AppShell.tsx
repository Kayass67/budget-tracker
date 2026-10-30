import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { CurrencySwitchModal } from '@/components/common/CurrencySwitchModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#F4F1FF] to-[#EAF7F4] text-slate-800">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Topbar />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Global Privacy Footer */}
        <footer className="px-4 py-6 max-w-7xl w-full mx-auto text-center border-t border-pastel-border/60 text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-mint" />
            <span>
              100% Client-Side Privacy: All financial data stays strictly inside your browser and
              nothing is sent anywhere, except the public exchange-rate request which transmits zero
              user data.
            </span>
          </p>
          <p className="text-[11px] text-slate-400">
            MyCA (My Personal Chartered Accountant) • Guidance tool only
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav />

      {/* Currency Switch Confirmation Modal */}
      <CurrencySwitchModal />
    </div>
  );
};
