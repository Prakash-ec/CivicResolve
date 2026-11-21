import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Menu,
  X,
  PlusCircle,
  Search,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Map,
  Newspaper,
  PhoneCall,
  Calendar,
  FileText,
  ChevronDown,
  Users,
  BrainCircuit,
  Camera,
  BarChart3,
} from 'lucide-react';
import { LanguageToggle } from '../../components/shared/LanguageToggle.js';
import { Button } from '../../components/ui/Button.js';
import { useAuth } from '../../features/auth/AuthContext.js';
import { CurrentLocationCard } from '../../components/location/CurrentLocationCard.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { currentUser, userProfile, isAdmin, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'90%' | '100%' | '110%'>('100%');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentLangCode, setCurrentLangCode] = useState(() => (i18n.language || 'en').split('-')[0]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLangCode((lng || 'en').split('-')[0]);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const isActive = (path: string) => location.pathname === path;

  // Determine user display name and avatar initial reliably
  const userDisplayName = isAdmin
    ? (userProfile?.displayName && userProfile.displayName !== 'Citizen'
        ? userProfile.displayName
        : 'Municipal Admin')
    : (userProfile?.displayName || 'Citizen');

  const avatarInitial = isAdmin
    ? (userDisplayName !== 'Municipal Admin' ? userDisplayName.charAt(0).toUpperCase() : 'A')
    : (userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'C');

  // Font resizer effect
  const handleFontSizeChange = (size: '90%' | '100%' | '110%') => {
    setFontSize(size);
    document.documentElement.style.fontSize = size;
  };

  // Close menus on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Formatted Indian / Global date
  const localeMap: Record<string, string> = {
    en: 'en-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    kn: 'kn-IN',
  };
  const currentDate = new Date().toLocaleDateString(localeMap[currentLangCode] || 'en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-border shadow-xs">
      {/* 1. Government Utility Top Bar in Deep Navy */}
      <div className="bg-[#0B132B] text-white text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-blue-200">
              <PhoneCall className="w-3 h-3 text-orange-400" />
              {t('nav.helpline')}: <span className="font-bold text-white tracking-wide">1800-425-1333</span>
            </span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-white/80">
              <Calendar className="w-3 h-3 text-blue-300" />
              {currentDate}
            </span>
            <span className="hidden lg:inline text-white/30">|</span>
            <CurrentLocationCard compact={true} className="hidden sm:inline-flex" />
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#main-content"
              className="text-white/70 hover:text-white transition-colors hidden md:inline text-[10px] underline"
            >
              {t('nav.screenReader')}
            </a>
            <span className="hidden md:inline text-white/30">|</span>
            {/* Font Resizer */}
            <div className="inline-flex items-center gap-1 font-mono text-[10px] bg-white/10 rounded px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => handleFontSizeChange('90%')}
                className={`px-1 rounded hover:bg-white/20 transition-colors ${
                  fontSize === '90%' ? 'font-bold text-orange-400 underline' : 'text-white/80'
                }`}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('100%')}
                className={`px-1 rounded hover:bg-white/20 transition-colors ${
                  fontSize === '100%' ? 'font-bold text-orange-400 underline' : 'text-white/80'
                }`}
                title="Default font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('110%')}
                className={`px-1 rounded hover:bg-white/20 transition-colors ${
                  fontSize === '110%' ? 'font-bold text-orange-400 underline' : 'text-white/80'
                }`}
                title="Increase font size"
              >
                A+
              </button>
            </div>
            <span className="text-white/30">|</span>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.75rem] py-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group py-1 shrink-0">
            <BrandLogo variant="full" size="lg" className="h-12 sm:h-14 md:h-16 w-auto group-hover:opacity-95 transition-all" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                isActive('/')
                  ? 'text-slate-900 bg-slate-100 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/track"
              className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                isActive('/track')
                  ? 'text-slate-900 bg-slate-100 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              {t('nav.track')}
            </Link>
            <Link
              to="/map"
              className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                isActive('/map')
                  ? 'text-slate-900 bg-slate-100 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-slate-500" />
              {t('nav.map')}
            </Link>
            <Link
              to="/community/issues"
              className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                isActive('/community/issues')
                  ? 'text-slate-900 bg-slate-100 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {t('nav.community')}
            </Link>
            <Link
              to="/accountability"
              className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                isActive('/accountability') || isActive('/transparency')
                  ? 'text-slate-900 bg-slate-100 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              {t('nav.accountability', 'Accountability')}
            </Link>
            <Link
              to="/news"
              className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                isActive('/news')
                  ? 'text-slate-900 bg-slate-100 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-slate-500" />
              {t('nav.news')}
            </Link>

            {/* Authenticated Citizen Links */}
            {currentUser && !isAdmin && (
              <>
                <Link
                  to="/citizen/dashboard"
                  className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive('/citizen/dashboard') || isActive('/dashboard')
                      ? 'text-slate-900 bg-slate-100 font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/citizen/my-complaints"
                  className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive('/citizen/my-complaints') || isActive('/my-complaints')
                      ? 'text-slate-900 bg-slate-100 font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  {t('nav.myComplaints')}
                </Link>
              </>
            )}

            {/* Admin Portal Links */}
            {isAdmin && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive('/admin') || isActive('/admin/dashboard')
                      ? 'text-[#0F2854] bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                  {t('nav.admin', 'Admin')}
                </Link>
                <Link
                  to="/admin/complaints"
                  className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive('/admin/complaints')
                      ? 'text-[#0F2854] bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  Triage
                </Link>
                <Link
                  to="/admin/intelligence"
                  className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive('/admin/intelligence')
                      ? 'text-[#0F2854] bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-slate-600" />
                  {t('nav.intelligence', 'AI Intelligence')}
                </Link>
                <Link
                  to="/admin/image-evidence"
                  className={`px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1.5 transition-colors ${
                    isActive('/admin/image-evidence')
                      ? 'text-[#0F2854] bg-blue-50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  {t('nav.imageEvidence', 'Evidence AI')}
                </Link>
              </div>
            )}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAdmin ? (
              <Link to="/admin">
                <button
                  type="button"
                  className="inline-flex items-center justify-center font-semibold rounded-lg text-xs px-3.5 py-2 bg-[#0F2854] hover:bg-[#1C4D8D] text-white transition-colors shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  Admin Console
                </button>
              </Link>
            ) : (
              <Link to="/citizen/report">
                <button
                  type="button"
                  className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  {t('nav.report')}
                </button>
              </Link>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors text-xs font-semibold text-slate-800"
                >
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs ${
                    isAdmin ? 'bg-orange-600 shadow-xs' : 'bg-[#0F2854]'
                  }`}>
                    {avatarInitial}
                  </div>
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="max-w-[100px] truncate text-xs font-semibold text-slate-800">
                      {userDisplayName}
                    </span>
                    {isAdmin && (
                      <span className="text-[9px] font-bold text-orange-600 tracking-wider">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-fadeIn">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-bold text-[#0F2854] truncate">
                          {userDisplayName}
                        </p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isAdmin
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isAdmin ? 'ADMIN' : 'CITIZEN'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/complaints"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Grievance Triage</span>
                        </Link>
                        <Link
                          to="/admin/intelligence"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Civic Intelligence</span>
                        </Link>
                        <Link
                          to="/admin/image-evidence"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-500" />
                          <span>Evidence AI Review</span>
                        </Link>
                        <Link
                          to="/admin/analytics"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Analytics & SLAs</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/citizen/dashboard"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t('nav.dashboard')}</span>
                        </Link>
                        <Link
                          to="/citizen/my-complaints"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t('nav.myComplaints')}</span>
                        </Link>
                        <Link
                          to="/citizen/profile"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t('nav.profile')}</span>
                        </Link>
                        <Link
                          to="/citizen/notifications"
                          className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t('nav.notifications')}</span>
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutUser();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 border-t border-slate-100 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-700 hover:text-[#0F2854]">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" size="sm" className="text-xs border-slate-300 text-[#0F2854] hover:bg-blue-50">
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-lg">
          <div className="mb-3 flex items-center justify-between gap-2">
            <CurrentLocationCard compact={false} />
            <LanguageToggle />
          </div>

          <Link
            to="/"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/') ? 'text-[#0F2854] bg-blue-50 font-bold' : 'text-slate-800'
            }`}
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/track"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/track') ? 'text-[#0F2854] bg-blue-50 font-bold' : 'text-slate-800'
            }`}
          >
            {t('nav.track')}
          </Link>
          <Link
            to="/map"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/map') ? 'text-[#0F2854] bg-blue-50 font-bold' : 'text-slate-800'
            }`}
          >
            {t('nav.map')}
          </Link>
          <Link
            to="/community/issues"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/community/issues') ? 'text-[#0F2854] bg-blue-50 font-bold' : 'text-slate-800'
            }`}
          >
            {t('nav.community')}
          </Link>
          <Link
            to="/accountability"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/accountability') ? 'text-[#0F2854] bg-blue-50 font-bold' : 'text-slate-800'
            }`}
          >
            {t('nav.accountability', 'Accountability')}
          </Link>
          <Link
            to="/news"
            className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
              isActive('/news') ? 'text-[#0F2854] bg-blue-50 font-bold' : 'text-slate-800'
            }`}
          >
            {t('nav.news')}
          </Link>

          {currentUser ? (
            isAdmin ? (
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-xs font-bold text-[#0F2854]">
                    {userDisplayName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                    ADMIN
                  </span>
                </div>
                <p className="px-3 text-xs font-medium text-slate-500 mb-1">
                  {t('nav.municipalAdmin', 'Municipal Administration')}
                </p>
                <Link
                  to="/admin"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-orange-700 bg-orange-50 mb-1"
                >
                  {t('nav.admin', 'Admin Dashboard')}
                </Link>
                <Link
                  to="/admin/complaints"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Grievance Triage
                </Link>
                <Link
                  to="/admin/intelligence"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#0F2854] hover:bg-slate-50"
                >
                  {t('nav.intelligence', 'Civic Intelligence')}
                </Link>
                <Link
                  to="/admin/image-evidence"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('nav.imageEvidence', 'Evidence AI Review')}
                </Link>
                <Link
                  to="/admin/analytics"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Analytics & SLAs
                </Link>
                <button
                  type="button"
                  onClick={logoutUser}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5 mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200">
                <p className="px-3 text-xs font-medium text-slate-500">
                  {t('nav.citizenWorkspace', 'Citizen workspace')}
                </p>
                <Link
                  to="/citizen/dashboard"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/citizen/report"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-orange-600 hover:bg-orange-50 font-bold"
                >
                  {t('nav.report')}
                </Link>
                <Link
                  to="/citizen/my-complaints"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('nav.myComplaints')}
                </Link>
                <Link
                  to="/citizen/profile"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('nav.profile')}
                </Link>
                <Link
                  to="/citizen/notifications"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('nav.notifications')}
                </Link>
                <button
                  type="button"
                  onClick={logoutUser}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1.5 mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            )
          ) : (
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
              <Link to="/login" className="w-full">
                <Button variant="outline" size="sm" className="w-full border-slate-300">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button variant="accent" size="sm" className="w-full">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
