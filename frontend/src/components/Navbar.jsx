import React from 'react';
import { 
  GraduationCap, 
  LogOut, 
  ShieldCheck, 
  User, 
  Database, 
  Sparkles,
  Calendar
} from 'lucide-react';

export default function Navbar({ currentUser, onLogout, onOpenLoginModal }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return {
          label: 'Student',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'instructor':
        return {
          label: 'Instructor',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'admin':
        return {
          label: 'Registrar Admin',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      default:
        return {
          label: 'Guest',
          color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        };
    }
  };

  const roleBadge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  CourseHub
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-2.5 h-2.5" /> 3NF ACID Core
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                University Registration & Management System
              </p>
            </div>
          </div>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Active Term Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fall 2026 Term</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* User Pill */}
                <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {currentUser.name ? currentUser.name[0] : (currentUser.username ? currentUser.username[0].toUpperCase() : 'U')}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">
                      {currentUser.name || currentUser.username}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                      {currentUser.department && (
                        <span className="text-[10px] text-slate-400 hidden md:inline">
                          • {currentUser.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <User className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
