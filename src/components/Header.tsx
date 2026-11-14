import React, { useState } from 'react';
import { Search, Menu, X, ShieldCheck, Database, LogOut, ChevronDown } from 'lucide-react';
import { SectionType } from '../types';

interface HeaderProps {
  currentSection: SectionType;
  onNavigate: (section: SectionType) => void;
  onOpenSearch: () => void;
  onOpenSheetModal: () => void;
  user: any | null;
  isOwner: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  connectedSheetId: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onNavigate,
  onOpenSearch,
  onOpenSheetModal,
  user,
  isOwner,
  onSignIn,
  onSignOut,
  isSigningIn,
  connectedSheetId
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks: { label: string; section: SectionType }[] = [
    { label: 'Home', section: 'home' },
    { label: 'Crops', section: 'crops' },
    { label: 'Pests', section: 'pests' },
    { label: 'Diseases', section: 'diseases' },
    { label: 'Farming Tips', section: 'tips' },
    { label: 'About', section: 'about' }
  ];

  const handleNavClick = (section: SectionType) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0" onClick={() => handleNavClick('home')}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#0a3520] shadow-md shadow-emerald-950/20 ring-2 ring-emerald-500/30 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <img
                src="/assets/aistudio/Screenshot_20261111-175134_8465347c.png"
                alt="AgroVya Logo"
                className="w-full h-full object-cover scale-105"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 font-sans">
                  Agro<span className="text-emerald-600">Vya</span>
                </span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-emerald-700 font-semibold leading-tight truncate">
                Smart Farming Starts Here!
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
            {navLinks.map(link => {
              const active = currentSection === link.section;
              return (
                <button
                  key={link.section}
                  onClick={() => handleNavClick(link.section)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 font-bold'
                      : 'text-stone-700 hover:text-emerald-800 hover:bg-emerald-50/80'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Tools: Search & Auth / Sheet */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Firestore DB Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firestore Active</span>
            </div>

            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-stone-600 bg-stone-100/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-stone-200 rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer"
              title="Search crops, pests, diseases (or press /)"
            >
              <Search className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="hidden lg:inline text-stone-400">Search crops, pests...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-stone-400 bg-white border border-stone-200 rounded-md">
                /
              </kbd>
            </button>

            {/* Google Sheets Status / Manager (if signed in) */}
            {user && (
              <button
                onClick={onOpenSheetModal}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  connectedSheetId
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
                title="Manage Google Sheets Database"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{connectedSheetId ? 'Sheet Linked' : 'Connect Sheet'}</span>
              </button>
            )}

            {/* User / Owner Authentication */}
            {!user ? (
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="gsi-material-button relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs sm:text-sm font-medium text-stone-700 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 hover:border-emerald-300 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <div className="flex items-center px-3 py-1.5 gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span className="font-semibold text-stone-700 hidden sm:inline">
                    {isSigningIn ? 'Connecting...' : 'Sign in'}
                  </span>
                  <span className="font-semibold text-stone-700 sm:hidden">
                    {isSigningIn ? '...' : 'Login'}
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border transition-all text-xs sm:text-sm font-semibold cursor-pointer ${
                    isOwner
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                  aria-expanded={userDropdownOpen}
                >
                  {isOwner ? (
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold">Owner</span>
                    </span>
                  ) : (
                    <span className="text-stone-600">Visitor</span>
                  )}
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="hidden sm:block w-6 h-6 rounded-full border border-emerald-300"
                    />
                  ) : (
                    <div className="hidden sm:flex w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 text-xs items-center justify-center font-bold">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-400 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-stone-900 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {isOwner ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                            Verified Owner (Full Edit Rights)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-stone-100 text-stone-600 rounded-md">
                            Student / Farmer (Read-Only)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenSheetModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2"
                      >
                        <Database className="w-4 h-4 text-emerald-600" />
                        Google Sheets Database Sync
                      </button>
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-stone-700 hover:bg-stone-100 hover:text-emerald-900 transition-colors shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-emerald-100 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-1">
            {navLinks.map(link => {
              const active = currentSection === link.section;
              return (
                <button
                  key={link.section}
                  onClick={() => handleNavClick(link.section)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSheetModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              {connectedSheetId ? 'Google Sheet Connected' : 'Connect Google Sheet'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
