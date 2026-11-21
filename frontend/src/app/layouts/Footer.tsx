import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'charter' | 'accessibility' | null>(null);

  return (
    <footer className="bg-[#0B132B] text-white pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Column 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="inline-block group py-1">
              <BrandLogo variant="white" size="lg" className="h-12 sm:h-14 w-auto group-hover:opacity-95 transition-all" />
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t('footer.aboutText')}
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t('footer.ledgerActive')}</span>
            </div>
          </div>

          {/* Column 3: Citizens */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-3">
              {t('footer.forCitizens')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/report" className="hover:text-white transition-colors">
                  {t('footer.reportIssue')}
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  {t('footer.trackGrievance')}
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-white transition-colors">
                  {t('footer.liveMap')}
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-white transition-colors">
                  {t('footer.civicNews')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  {t('footer.citizenDashboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Administration */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-3">
              {t('footer.authorities')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  {t('footer.adminPortal')}
                </Link>
              </li>
              <li>
                <Link to="/admin/complaints" className="hover:text-white transition-colors">
                  {t('footer.triageQueue')}
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="hover:text-white transition-colors">
                  {t('footer.analytics')}
                </Link>
              </li>
              <li>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  {t('footer.systemHealth')}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact & Help */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-3">
              {t('footer.helpline')}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block font-sans">1800-425-1333</strong>
                  <span className="text-[10px] text-slate-400">{t('footer.tollFree')}</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="break-all">support@civicresolve.gov.in</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{t('footer.ripon')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Utility & Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>{t('footer.copyright')}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="hover:text-white underline transition-colors"
            >
              {t('footer.privacy')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="hover:text-white underline transition-colors"
            >
              {t('footer.terms')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('charter')}
              className="hover:text-white underline transition-colors"
            >
              {t('footer.charter')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('accessibility')}
              className="hover:text-white underline transition-colors"
            >
              {t('footer.accessibility')}
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Policy Dialogs */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn text-slate-900"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#0F2854]">
                {activeModal === 'privacy' && t('footer.privacy')}
                {activeModal === 'terms' && t('footer.terms')}
                {activeModal === 'charter' && t('footer.charter')}
                {activeModal === 'accessibility' && t('footer.accessibility')}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 max-h-80 overflow-y-auto leading-relaxed">
              {activeModal === 'privacy' && (
                <>
                  <p>
                    CivicResolve safeguards citizen privacy by strictly storing only authenticated profile credentials and public issue coordinates.
                  </p>
                  <p>
                    <strong>Image Safety:</strong> Photographic evidence is scanned by multimodal AI for civic verification and stripped of any personal metadata before publication.
                  </p>
                  <p>
                    <strong>Location Accuracy:</strong> Geolocation coordinates are used solely to dispatch municipal crews to reported potholes, leaks, and hazards.
                  </p>
                </>
              )}
              {activeModal === 'terms' && (
                <>
                  <p>
                    By submitting grievances through CivicResolve, you confirm that reports represent genuine civic defects within municipal jurisdictions.
                  </p>
                  <p>
                    Frivolous, abusive, or intentionally fabricated complaints are rejected by automated checks and administrative review.
                  </p>
                </>
              )}
              {activeModal === 'charter' && (
                <>
                  <p>
                    <strong>Guaranteed Transparency:</strong> Every valid civic complaint receives an immutable Public Reference ID (`CR-2026-XXXXXX`) within seconds of submission.
                  </p>
                  <p>
                    <strong>Citizen Verification Lock:</strong> No grievance can be marked closed by municipal contractors until the reporting citizen confirms the resolution or after a 7-day public review window.
                  </p>
                </>
              )}
              {activeModal === 'accessibility' && (
                <>
                  <p>
                    CivicResolve conforms to WCAG 2.1 Level AA guidelines, supporting screen readers, keyboard navigation, dynamic font resizing (A-, A, A+), and high-contrast color palettes.
                  </p>
                  <p>
                    English, Tamil, Hindi, Telugu, and Kannada localizations are natively embedded for inclusive citizen access.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
