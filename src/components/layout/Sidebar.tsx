import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { navigationItems } from './navConfig';

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white/70 backdrop-blur-xl border-r border-pastel-border shadow-pastel p-5 shrink-0 z-30 justify-between">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-primary-400 flex items-center justify-center text-white shadow-pastel font-bold text-lg">
            CA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-slate-800 tracking-tight">MyCA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-700 uppercase">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Personal Chartered Accountant</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm shadow-primary/20 translate-x-1'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Safety & Offline Badge */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-mint/15 to-primary/10 border border-pastel-border text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-mint-dark" />
          <span>Private & Offline</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Zero cloud telemetry. Your finances never leave this device.
        </p>
      </div>
    </aside>
  );
};
