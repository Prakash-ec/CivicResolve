import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Map as MapIcon,
  Compass,
  Check,
  Trash2,
  Droplets,
  Lightbulb,
  Zap,
  Building2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { publicService } from '../../services/api.js';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';

interface PublicStats {
  total: number;
  resolved: number;
  inProgress: number;
  activeCitizens: number;
  resolutionRate: number;
  creditsAwarded: number;
}

interface FeedItem {
  id: string;
  publicId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  statusLabel: string;
  location: {
    addressText: string;
    ward?: string;
  };
  upvotes: number;
  createdAt: string;
}

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { coords: liveCoords, address: liveAddress, status: locationStatus, refreshLocation } = useCurrentLocation();
  const [trackerInput, setTrackerInput] = useState('');
  const [stats, setStats] = useState<PublicStats>({
    total: 1420,
    resolved: 1184,
    inProgress: 182,
    activeCitizens: 3420,
    resolutionRate: 83.4,
    creditsAwarded: 24900,
  });
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch Public Stats and Live Feed on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const statsRes = await publicService.getPublicStats();
        if (isMounted && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.warn('Could not load live stats, using fallback defaults', err);
      }

      try {
        const feedRes = await publicService.getPublicFeed(8);
        if (isMounted && feedRes.data && feedRes.data.length > 0) {
          setFeed(feedRes.data);
        } else if (isMounted) {
          setFeed([
            {
              id: 'cr-feed-1',
              publicId: 'CR-2026-004128',
              title: 'Deep Pothole on Anna Salai Inner Lane',
              description: 'Exposed bitumen crater causing two-wheelers to skid near junction signal.',
              category: 'pothole_road_damage',
              priority: 'HIGH',
              status: 'IN_PROGRESS',
              statusLabel: 'Repair Crew Deployed',
              location: { addressText: 'Anna Salai, Thousand Lights, Chennai', ward: 'Ward 114' },
              upvotes: 42,
              createdAt: '2 hours ago',
            },
            {
              id: 'cr-feed-2',
              publicId: 'CR-2026-004115',
              title: 'Overflowing Waste Bins at Commercial Market',
              description: 'Commercial market garbage accumulation spilling onto sidewalk for 48 hours.',
              category: 'garbage_overflow',
              priority: 'MEDIUM',
              status: 'RESOLVED',
              statusLabel: 'Cleared & Sanitized',
              location: { addressText: 'T. Nagar Market Road, Chennai', ward: 'Ward 132' },
              upvotes: 29,
              createdAt: '5 hours ago',
            },
            {
              id: 'cr-feed-3',
              publicId: 'CR-2026-004099',
              title: 'Continuous Drinking Water Pipeline Breach',
              description: 'Pressurized water leaking from underground pipe along main corridor.',
              category: 'water_leakage',
              priority: 'CRITICAL',
              status: 'IN_PROGRESS',
              statusLabel: 'Valve Isolated',
              location: { addressText: 'Velachery Main Road, Chennai', ward: 'Ward 178' },
              upvotes: 68,
              createdAt: '1 day ago',
            },
            {
              id: 'cr-feed-4',
              publicId: 'CR-2026-004082',
              title: 'Inactive Streetlights on 4th Main School Zone Corridor',
              description: 'Six consecutive fixtures inactive on school pedestrian stretch.',
              category: 'broken_streetlight',
              priority: 'HIGH',
              status: 'RESOLVED',
              statusLabel: 'LED Drivers Replaced',
              location: { addressText: 'Adyar 4th Main Road, Chennai', ward: 'Ward 173' },
              upvotes: 35,
              createdAt: '2 days ago',
            },
          ]);
        }
      } catch (err) {
        console.warn('Could not load live feed', err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerInput.trim()) return;
    navigate(`/track?id=${encodeURIComponent(trackerInput.trim().toUpperCase())}`);
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (votedIds[id]) return;

    try {
      await publicService.upvoteComplaint(id);
      setVotedIds((prev) => ({ ...prev, [id]: true }));
      setFeed((prev) =>
        prev.map((item) => (item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item))
      );
    } catch {
      setVotedIds((prev) => ({ ...prev, [id]: true }));
      setFeed((prev) =>
        prev.map((item) => (item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item))
      );
    }
  };

  const nextSlide = () => {
    if (feed.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % feed.length);
  };

  const prevSlide = () => {
    if (feed.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + feed.length) % feed.length);
  };

  const issueCategories = [
    {
      id: 'pothole_road_damage',
      icon: AlertTriangle,
      title: t('categories.roadsPavements', 'Roads & pavements'),
      desc: t('categories.roadsPavementsDesc', 'Potholes, broken asphalt, damaged footpaths, and cave-ins'),
    },
    {
      id: 'garbage_overflow',
      icon: Trash2,
      title: t('categories.solidWaste', 'Solid waste management'),
      desc: t('categories.solidWasteDesc', 'Overflowing bins, uncollected neighborhood waste, and street debris'),
    },
    {
      id: 'broken_streetlight',
      icon: Lightbulb,
      title: t('categories.streetLighting', 'Street lighting'),
      desc: t('categories.streetLightingDesc', 'Darkened public stretches, broken fixtures, and power faults'),
    },
    {
      id: 'water_leakage',
      icon: Droplets,
      title: t('categories.waterSupply', 'Water supply'),
      desc: t('categories.waterSupplyDesc', 'Pipeline bursts, water supply leakage, and low pressure'),
    },
    {
      id: 'exposed_electrical_hazard',
      icon: Zap,
      title: t('categories.electricalHazards', 'Electrical hazards'),
      desc: t('categories.electricalHazardsDesc', 'Hanging live wires, damaged junction boxes, and transformer sparks'),
    },
    {
      id: 'sewage_overflow',
      icon: Droplets,
      title: t('categories.drainageSewage', 'Drainage & sewage'),
      desc: t('categories.drainageSewageDesc', 'Blocked stormwater drains and sewage overflows on public ways'),
    },
    {
      id: 'public_infrastructure_damage',
      icon: Building2,
      title: t('categories.publicStructures', 'Public structures'),
      desc: t('categories.publicStructuresDesc', 'Damaged bus stops, broken park boundaries, and cracked culverts'),
    },
    {
      id: 'other',
      icon: HelpCircle,
      title: t('categories.otherMatters', 'Other municipal matters'),
      desc: t('categories.otherMattersDesc', 'Encroachments, illegal debris disposal, and public nuisances'),
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 py-8">
      {/* ======================================================== */}
      {/* 1. HERO SECTION: ASYMMETRIC MUNICIPAL SPLIT */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Clear civic mandate and immediate actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t('hero.badge', 'Municipal Public Works Ledger')}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F2854] tracking-tight leading-[1.15]">
              {t('hero.title', 'A better city begins with one report.')}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              {t('hero.subtitle', 'Report civic infrastructure grievances, let AI evaluate urgency and dispatch field teams directly to your municipal ward.')}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/report">
                <button
                  type="button"
                  className="inline-flex items-center justify-center font-medium rounded-lg text-sm px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                >
                  {t('hero.reportCta', 'Report an issue')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <Link to="/map">
                <Button
                  variant="outline"
                  size="md"
                  className="text-xs font-medium border-slate-300 text-slate-800 hover:bg-slate-50"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  {t('hero.mapCta', 'Zonal incident map')}
                </Button>
              </Link>
            </div>

            {/* Search reference bar */}
            <div className="pt-2 max-w-lg">
              <form
                onSubmit={handleTrackSubmit}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-slate-200 focus-within:border-slate-400 transition-colors"
              >
                <div className="pl-2.5 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={trackerInput}
                  onChange={(e) => setTrackerInput(e.target.value)}
                  placeholder={t('hero.searchPlaceholder', 'Reference ID (e.g. CR-2026-001248)')}
                  className="w-full text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#0F2854] hover:bg-[#1C4D8D] text-white text-xs font-medium shrink-0 transition-colors"
                >
                  {t('hero.trackBtn', 'Track')}
                </button>
              </form>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {t('hero.noLoginRequired', 'No login required for public status tracking')}
              </p>
            </div>
          </div>

          {/* Right Column: Moment — Municipal Incident Ledger Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    CR-2026-004128
                  </span>
                  <span className="text-[11px] text-slate-500">{t('common.ward', 'Ward')} 114</span>
                </div>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {t('preview.crewDeployed', 'Crew deployed')}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t('preview.sampleTitle', 'Bitumen crater on Anna Salai Inner Lane')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('preview.sampleDesc', 'Pothole measuring 1.2m across near junction traffic signal. Assigned to Corporation Highway Division with 48h repair SLA.')}
                </p>

                {/* Audit metadata table */}
                <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t('preview.department', 'Department')}</span>
                    <span className="font-medium text-slate-900">{t('preview.highwaysDrainage', 'Highways & Drainage')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t('preview.inspectionPriority', 'Inspection priority')}</span>
                    <span className="font-medium text-orange-700">{t('preview.highHazardScore', 'High (Hazard score 75)')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t('preview.coordinates', 'Coordinates')}</span>
                    <span className="font-mono text-[11px] text-slate-700">13.0569° N, 80.2525° E</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t('preview.communityConfirmation', 'Community confirmation')}</span>
                    <span className="font-medium text-slate-900">{t('preview.residentsVerified', '42 residents verified')}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{t('preview.loggedTime', 'Logged: 2 hours ago')}</span>
                  <Link
                    to="/track?id=CR-2026-004128"
                    className="text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1"
                  >
                    <span>{t('preview.viewFullDossier', 'View full dossier')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. REAL-TIME RESOLUTION COUNTERS (LIVE TRANSPARENCY BAR) */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200">
          <div className="space-y-1 p-2">
            <span className="text-xs text-slate-500 font-normal block">
              Complaints filed
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tabular-nums">
              {stats.total.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 block">
              Across 15 municipal zones
            </span>
          </div>

          <div className="space-y-1 p-2 border-l border-slate-100">
            <span className="text-xs text-slate-500 font-normal block">
              Resolved and verified
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-emerald-700 font-mono tabular-nums">
              {stats.resolved.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 block">
              {stats.resolutionRate}% verified closure rate
            </span>
          </div>

          <div className="space-y-1 p-2 border-l border-slate-100">
            <span className="text-xs text-slate-500 font-normal block">
              Field work in progress
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-amber-700 font-mono tabular-nums">
              {stats.inProgress.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 block">
              Crews active on site
            </span>
          </div>

          <div className="space-y-1 p-2 border-l border-slate-100">
            <span className="text-xs text-slate-500 font-normal block">
              Participating citizens
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-slate-900 font-mono tabular-nums">
              {stats.activeCitizens.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 block">
              {stats.creditsAwarded.toLocaleString()} utility credits issued
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CHARTER — PUBLIC SERVICE COMMITMENTS */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <img src="/logo-icon.png" alt="CivicResolve" className="w-3.5 h-3.5 object-contain" />
              <span>Public Service Charter</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2854] leading-snug">
              Direct municipal accountability through timestamped evidence
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every reported road crater, severed electrical line, or sewage blockage is logged into a public ledger with fixed service-level targets and verifiable photographic records.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Immutable public audit trail
                  </h4>
                  <p className="text-xs text-slate-600">
                    Each status update is recorded with officer role and timestamp. Tickets cannot be closed without documentation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Citizen verification lock
                  </h4>
                  <p className="text-xs text-slate-600">
                    Resolution requires complainant sign-off or geotagged repair photo before the file is marked complete.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Automated departmental routing
                  </h4>
                  <p className="text-xs text-slate-600">
                    Photo evidence evaluates structural hazard severity and assigns tickets directly to the relevant municipal engineer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit report inspection card */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-mono text-xs text-slate-300">
                CR-2026-AUDIT-SAMPLE
              </span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Verified closed
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Assigned department</span>
                  <span className="font-medium text-slate-200">Highways & Road Maintenance</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Repair turnaround</span>
                  <span className="font-mono text-slate-200">28 hours (SLA target: 48 hours)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Verification evidence</span>
                  <span className="font-medium text-slate-200">2 on-site photos logged</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                "Work completed with bitumen cold-mix layering. Inspected and approved by Ward 114 resident representative."
              </p>
              <div className="text-[11px] text-slate-400">
                Corporation Engineering Division, Zonal Office V
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. MUNICIPAL RESOLUTION PIPELINE */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-8 space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F2854]">
            Resolution pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Four documented milestones from initial report to verified closure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <span className="text-xs font-mono font-medium text-slate-400 block">Stage 1</span>
            <h3 className="font-semibold text-sm text-slate-900">Documentation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Citizen captures photo evidence and coordinates. Pre-submission checks verify nearby duplicates.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <span className="text-xs font-mono font-medium text-slate-400 block">Stage 2</span>
            <h3 className="font-semibold text-sm text-slate-900">Triage & routing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Defect category and life-safety score determine response urgency and departmental jurisdiction.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <span className="text-xs font-mono font-medium text-slate-400 block">Stage 3</span>
            <h3 className="font-semibold text-sm text-slate-900">Crew deployment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zonal maintenance crews receive location markers and repair orders. Progress logged in public register.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <span className="text-xs font-mono font-medium text-slate-400 block">Stage 4</span>
            <h3 className="font-semibold text-sm text-slate-900">Verified closure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Before and after photographs recorded. Complainant confirms repair quality before ticket archiving.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. LIVE GRIEVANCES CAROUSEL */}
      {/* ======================================================== */}
      {feed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-600" />
                <h2 className="text-lg sm:text-xl font-bold text-[#0F2854]">
                  Recent neighborhood grievances
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Live register of citizen filings and field progress across city wards.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevSlide}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                aria-label="Previous grievances"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                aria-label="Next grievances"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards Carousel View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feed.slice(carouselIndex, carouselIndex + 3).concat(
              feed.slice(0, Math.max(0, carouselIndex + 3 - feed.length))
            ).map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {comp.publicId}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        comp.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : comp.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {comp.statusLabel}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 line-clamp-2">
                    {comp.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {comp.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{comp.location.addressText}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={(e) => handleUpvote(comp.id, e)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
                        votedIds[comp.id]
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 text-slate-500" />
                      <span>{comp.upvotes || 0} votes</span>
                    </button>

                    <Link
                      to={`/track?id=${comp.publicId}`}
                      className="text-xs font-medium text-slate-800 hover:text-orange-600 inline-flex items-center gap-1"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 6. ZONAL INCIDENT MAP */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-700" />
                <h2 className="text-lg sm:text-xl font-bold text-[#0F2854]">
                  Zonal incident map
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Geospatial clustering and active municipal maintenance zones. Automatically updates to your location.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refreshLocation()}
                className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
                title="Refresh location and update map"
              >
                <Compass className={`w-3.5 h-3.5 mr-1.5 text-orange-500 ${locationStatus === 'requesting' ? 'animate-spin' : ''}`} />
                <span>{locationStatus === 'requesting' ? 'Detecting...' : liveCoords ? 'Update Location' : 'Locate Me'}</span>
              </button>

              <Link to="/map">
                <button
                  type="button"
                  className="inline-flex items-center justify-center font-medium rounded-lg text-xs px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                >
                  <MapIcon className="w-3.5 h-3.5 mr-1.5" />
                  Open full explorer
                </button>
              </Link>
            </div>
          </div>

          {/* Embedded Map Frame with Real-Time Coords Update */}
          <div className="h-72 sm:h-96 w-full rounded-xl overflow-hidden border border-slate-200 relative group shadow-xs">
            <iframe
              key={`${liveCoords ? liveCoords.lat : 13.0827}-${liveCoords ? liveCoords.lng : 80.2707}`}
              title="CivicResolve Live Map Canvas"
              src={`https://maps.google.com/maps?q=${liveCoords ? liveCoords.lat : 13.0827},${liveCoords ? liveCoords.lng : 80.2707}&hl=en&z=14&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            />
            
            {/* Live Location Identification Badge */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2 shadow-sm max-w-[85%] sm:max-w-md">
              <span className="relative flex h-2 w-2 shrink-0">
                {liveCoords ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                )}
              </span>
              <span className="truncate font-semibold text-slate-900">
                {liveAddress?.locality
                  ? `${liveAddress.locality}, ${liveAddress.villageOrCity || liveAddress.district || 'Civic Area'}`
                  : liveAddress?.villageOrCity
                  ? `${liveAddress.villageOrCity}, ${liveAddress.district || 'Municipal Region'}`
                  : liveCoords
                  ? `Active Location (${liveCoords.lat.toFixed(4)}, ${liveCoords.lng.toFixed(4)})`
                  : 'Chennai Metropolitan Corporation Area'}
              </span>
              {liveCoords && (
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline shrink-0">
                  (±{Math.round(liveCoords.accuracy)}m)
                </span>
              )}
            </div>

            {/* Bottom Status Hint */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-md text-[10px] pointer-events-none flex items-center gap-1.5 shadow">
              <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
              <span>
                {liveCoords
                  ? 'Map centered on your verified active location'
                  : 'Map dynamically centers on your GPS location as soon as active'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. COMPLAINT CATEGORY OVERVIEW */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-6 space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F2854]">
            Municipal grievance categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Structured classifications routed to designated civil engineering divisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {issueCategories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-700">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900">{cat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <Link
                  to="/report"
                  className="text-xs font-medium text-slate-700 hover:text-orange-600 flex items-center gap-1 pt-1"
                >
                  <span>Report in this category</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. PRE-FOOTER CALL TO ACTION */}
      {/* ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="rounded-2xl bg-[#0F2854] p-8 sm:p-10 text-white text-center space-y-4">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
            Register a civic issue in your ward
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Submit photographic evidence and track repair milestones directly with municipal zonal offices.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/report">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-lg text-sm px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
              >
                File a grievance
              </button>
            </Link>
            <Link to="/track">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-lg text-sm px-5 py-2.5 border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                Track existing complaint
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
