import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  MapPin,
  Camera,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Trash2,
  Lightbulb,
  Droplets,
  Zap,
  Building2,
  Copy,
  PlusCircle,
  HelpCircle,
  Clock,
  Shield,
  Smartphone,
  Info,
} from 'lucide-react';
import { LocationPickerMap } from '../../components/maps/LocationPickerMap.js';
import {
  GeographicHierarchySelector,
  GeographicSelection,
} from '../../components/forms/GeographicHierarchySelector.js';
import { StructuredAddress } from '../../services/geocodingService.js';
import { ImageUploadZone } from '../../components/forms/ImageUploadZone.js';
import { VoiceInputButton } from '../../components/forms/VoiceInputButton.js';
import { Button } from '../../components/ui/Button.js';
import { COMPLAINT_CATEGORIES, ComplaintCategory } from '../../types/index.js';
import { apiClient, communityService } from '../../services/api.js';
import { useAuth } from '../../features/auth/AuthContext.js';
import { useCurrentLocation } from '../../hooks/useCurrentLocation.js';
import { useOfflineDrafts } from '../../hooks/useOfflineDrafts.js';

const categoryOptions: Array<{
  id: ComplaintCategory;
  label: string;
  icon: any;
}> = [
  { id: 'pothole_road_damage', label: 'Pothole / Road Damage', icon: AlertTriangle },
  { id: 'garbage_overflow', label: 'Garbage Overflow', icon: Trash2 },
  { id: 'illegal_dumping', label: 'Illegal Waste Dumping', icon: Trash2 },
  { id: 'streetlight_failure', label: 'Broken Streetlight', icon: Lightbulb },
  { id: 'water_leakage', label: 'Water Leakage', icon: Droplets },
  { id: 'drainage_blockage', label: 'Drainage Blockage', icon: Droplets },
  { id: 'sewage_overflow', label: 'Sewage Overflow', icon: Droplets },
  { id: 'exposed_electrical_hazard', label: 'Exposed Electrical Hazard', icon: Zap },
  { id: 'public_infrastructure_damage', label: 'Damaged Public Infrastructure', icon: Building2 },
  { id: 'other', label: 'Other Civic Grievance', icon: HelpCircle },
];

const reportSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  userCategory: z.enum(COMPLAINT_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a complaint category' }),
  }),
  description: z
    .string()
    .min(15, 'Please provide at least 15 characters describing the issue')
    .max(3000, 'Description cannot exceed 3000 characters'),
  addressText: z
    .string()
    .min(3, 'Address must be at least 3 characters')
    .max(300, 'Address is too long'),
  ward: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export const ReportIssuePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { phoneVerified, phoneNumber } = useAuth();
  const { coords: globalCoords, address: globalAddress } = useCurrentLocation();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: globalCoords ? globalCoords.lat : 11.0018,
    lng: globalCoords ? globalCoords.lng : 77.0143,
  }));
  const [accuracyMeters, setAccuracyMeters] = useState<number>(() =>
    globalCoords ? globalCoords.accuracy : 15
  );
  const [structuredAddr, setStructuredAddr] = useState<StructuredAddress>({
    fullFormattedAddress: '',
  });
  const [geoSelection, setGeoSelection] = useState<GeographicSelection>({
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    municipality: 'Coimbatore City Municipal Corporation',
    zone: 'East Zone',
    ward: 'Ward 50 - Singanallur North',
    locality: 'Singanallur',
    verificationStatus: 'verified',
  });
  const [showDetailedAddressFields, setShowDetailedAddressFields] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiImproveNotice, setAiImproveNotice] = useState<string | null>(null);

  // Duplicate candidate alert state
  const [duplicateCandidate, setDuplicateCandidate] = useState<{
    id: string;
    publicId: string;
    title: string;
    category: string;
    distanceMeters: number;
  } | null>(null);

  // Success state payload
  const [submittedData, setSubmittedData] = useState<{
    publicId: string;
    complaintId: string;
    complaint: any;
    storageNotice?: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState(false);
  const { isOnline, saveDraft } = useOfflineDrafts();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      userCategory: 'pothole_road_damage',
      description: '',
      addressText: globalAddress?.fullFormattedAddress || '',
      ward: globalAddress?.ward || '',
    },
  });

  // Auto-sync coordinates when website fetches live location
  useEffect(() => {
    if (globalCoords) {
      setCoords({ lat: globalCoords.lat, lng: globalCoords.lng });
      setAccuracyMeters(globalCoords.accuracy);
    }
  }, [globalCoords?.lat, globalCoords?.lng]);

  // Auto-populate address fields if empty when live location resolves
  useEffect(() => {
    if (globalAddress) {
      setStructuredAddr(globalAddress);
      if (globalAddress.fullFormattedAddress && !getValues('addressText')) {
        setValue('addressText', globalAddress.fullFormattedAddress, { shouldValidate: true });
      }
      if (globalAddress.ward && !getValues('ward')) {
        setValue('ward', globalAddress.ward, { shouldValidate: true });
      }
    }
  }, [globalAddress]);

  const currentCategory = watch('userCategory');
  const currentDescription = watch('description');

  // Check for nearby duplicates when coords or category change
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      try {
        const res = await communityService.checkDuplicate(coords.lat, coords.lng, currentCategory);
        if (active && res.duplicateFound && res.candidate) {
          setDuplicateCandidate(res.candidate);
        } else if (active) {
          setDuplicateCandidate(null);
        }
      } catch {
        if (active) setDuplicateCandidate(null);
      }
    }, 600);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [coords.lat, coords.lng, currentCategory]);

  const handleAiImprove = async () => {
    if (!currentDescription || currentDescription.length < 10) {
      setAiImproveNotice('Please write at least a rough draft (10+ characters) first.');
      return;
    }

    setAiImproving(true);
    setAiImproveNotice(null);
    try {
      const response = await apiClient<{
        success: boolean;
        improvedText: string;
        summary?: string;
        message?: string;
      }>('/ai/improve-description', {
        method: 'POST',
        body: JSON.stringify({ draft: currentDescription }),
      });

      if (response.success && response.improvedText && response.improvedText !== currentDescription) {
        setValue('description', response.improvedText, { shouldValidate: true });
        setAiImproveNotice('Description improved with municipal context!');
      } else {
        setAiImproveNotice(response.message || 'AI suggestion is currently offline; your draft description is preserved.');
      }
    } catch {
      setAiImproveNotice('AI suggestion unavailable; your draft description is preserved.');
    } finally {
      setAiImproving(false);
    }
  };

  const onSubmit = async (values: ReportFormValues) => {
    setSubmissionError(null);

    // If device is offline, store draft locally and show confirmation
    if (!navigator.onLine || !isOnline) {
      const saved = saveDraft({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.userCategory,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          addressText: values.addressText.trim(),
          ward: geoSelection.ward || values.ward?.trim(),
        },
      });

      setSubmittedData({
        publicId: 'OFFLINE-QUEUED',
        complaintId: saved.id,
        complaint: {
          publicId: 'OFFLINE-QUEUED',
          title: values.title,
          description: values.description,
          status: 'QUEUED_FOR_SYNC',
          statusLabel: 'Offline Draft Saved',
          userCategory: values.userCategory,
          createdAt: new Date().toISOString(),
          location: { addressText: values.addressText },
          department: { name: 'Greater Chennai Corporation (Queued)' },
        },
        storageNotice:
          'Offline Mode: Your grievance has been stored securely on your device. It will automatically synchronize with CivicResolve as soon as your connection is restored.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', String(values.title).trim());
      formData.append('userCategory', String(values.userCategory));
      formData.append('description', String(values.description).trim());
      formData.append(
        'location',
        JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          accuracyMeters,
          addressText: values.addressText.trim(),
          houseNumber: structuredAddr.houseNumber || undefined,
          street: structuredAddr.street || undefined,
          locality: geoSelection.locality || structuredAddr.locality || undefined,
          neighbourhood: structuredAddr.neighbourhood || undefined,
          city: geoSelection.municipality || structuredAddr.villageOrCity || undefined,
          district: geoSelection.district || structuredAddr.district || 'Coimbatore',
          state: geoSelection.state || structuredAddr.state || 'Tamil Nadu',
          postalCode: structuredAddr.postalCode || undefined,
          country: structuredAddr.country || 'India',
          zone: geoSelection.zone || undefined,
          zoneId: geoSelection.zoneId || undefined,
          ward: geoSelection.ward || values.ward?.trim() || undefined,
          wardId: geoSelection.wardId || undefined,
          regionVerificationStatus: geoSelection.verificationStatus,
          geocodingSource: 'NOMINATIM_OSM_AND_CCMC_GIS',
        })
      );

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      // Submit via citizenService or apiClient without manual application/json header
      const result = await apiClient<{
        success: boolean;
        publicId: string;
        complaintId: string;
        complaint: any;
        storageNotice?: string;
      }>('/complaints', {
        method: 'POST',
        body: formData,
      });

      setSubmittedData(result);
    } catch (err: any) {
      const msg = err.message || err.error?.message || 'Failed to submit grievance. Please try again.';
      setSubmissionError(msg);
      if (err.fieldErrors && typeof err.fieldErrors === 'object') {
        Object.entries(err.fieldErrors).forEach(([field, message]) => {
          if (field in values || field.startsWith('location.')) {
            const fieldName = field === 'location.addressText' ? 'addressText' : field;
            setError(fieldName as any, { type: 'server', message: String(message) });
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedData) {
    const comp = submittedData.complaint;
    const aiSuccess = comp.aiStatus === 'success';

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-elevation p-6 sm:p-10 space-y-8 text-center sm:text-left">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-[#0F2854] text-orange-400 flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Grievance Successfully Registered
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] tracking-tight">
                Your report has been submitted.
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Your grievance is assigned to the municipal queue and entered into the immutable status ledger.
              </p>
            </div>
          </div>

          {/* Reference ID Card */}
          <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2854] block">
                Public Complaint Reference ID
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F2854] font-mono tracking-tight block mt-0.5">
                {submittedData.publicId}
              </span>
              <span className="text-xs text-slate-600 block mt-1">
                Save this ID to track live municipal progress without needing to log in.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyId(submittedData.publicId)}
              className="bg-white hover:bg-blue-50 shrink-0 border-slate-300 text-[#0F2854]"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
              {copiedId ? 'Copied!' : 'Copy ID'}
            </Button>
          </div>

          {/* AI Triage Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm text-[#0F2854]">
                  Multimodal AI Analysis
                </h3>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  aiSuccess
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {aiSuccess ? 'AI Analysis Complete' : 'Queued for Human Review'}
              </span>
            </div>

            {aiSuccess && comp.aiAnalysis ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  <span className="font-semibold text-[#0F2854]">AI Summary: </span>
                  {comp.aiAnalysis.englishSummary}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Assigned Department
                    </span>
                    <span className="font-semibold text-[#0F2854] block mt-0.5">
                      {comp.department.name}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Priority Level
                    </span>
                    <span className="font-semibold text-orange-600 capitalize block mt-0.5">
                      {comp.priority.level} (Score: {comp.priority.score})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Confidence
                    </span>
                    <span className="font-semibold text-[#0F2854] block mt-0.5">
                      {Math.round(comp.aiAnalysis.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                AI analysis is currently processed. Your complaint has been safely recorded and routed to the municipal human triage queue without delay.
              </p>
            )}
          </div>

          {/* Details Summary */}
          <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F2854]">Location:</span>
              <span>{comp.location.addressText}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F2854]">Category:</span>
              <span className="capitalize">{comp.userCategory.replace(/_/g, ' ')}</span>
            </div>
            {submittedData.storageNotice && (
              <p className="text-[11px] text-amber-700 pt-1">
                Notice: {submittedData.storageNotice}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link to="/citizen/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-[#0F2854] hover:bg-[#1C4D8D]">
                Go to Citizen Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-300 text-[#0F2854]"
              onClick={() => {
                setSubmittedData(null);
                setSelectedImage(null);
                reset();
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Report Another Issue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD FORM VIEW
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 mb-1">
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Municipal grievance filing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2854] tracking-tight">
          Report a Civic Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Provide issue details and location. Our triage engine evaluates urgency and routes directly to field teams.
        </p>
      </div>

      {/* Phone Verification Notice Banner */}
      {phoneVerified ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Verified Citizen Account:</strong> Phone authentication active ({phoneNumber}). High-priority dispatch enabled.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            Priority Queue
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Pro-Tip:</strong> Link your mobile number in Profile to unlock instant municipal SMS dispatch updates and priority verification.
            </span>
          </div>
          <Link
            to="/citizen/profile"
            className="text-amber-800 font-bold hover:underline shrink-0 text-xs flex items-center gap-1"
          >
            <span>Link Mobile Number</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Duplicate Issue Proximity Banner */}
      {duplicateCandidate && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-[#0F2854] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block">Similar nearby issue detected:</span>
              <span className="text-slate-600">
                "{duplicateCandidate.title}" is located {duplicateCandidate.distanceMeters}m away.
              </span>
            </div>
          </div>
          <Link
            to="/community/issues"
            className="px-3.5 py-1.5 bg-[#0F2854] hover:bg-[#1C4D8D] text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Confirm Existing Issue Instead &rarr;
          </Link>
        </div>
      )}

      {submissionError && (
        <div
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span className="leading-relaxed font-medium">{submissionError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* ======================================================== */}
        {/* SECTION A: What Happened? */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F2854]">
                What happened?
              </h2>
              <p className="text-xs text-slate-500">
                Describe the civic problem clearly for municipal crews.
              </p>
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                errors.title ? 'border-red-500' : 'border-slate-200 focus:border-[#0F2854]'
              }`}
              placeholder="e.g. Hazardous deep pothole on arterial road"
            />
            {errors.title && (
              <p id="title-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Category Selection Grid */}
          <div>
            <label id="category-label" className="block text-xs font-medium text-slate-700 mb-2">
              Select Issue Category <span className="text-red-500">*</span>
            </label>
            <Controller
              name="userCategory"
              control={control}
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-labelledby="category-label"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
                >
                  {categoryOptions.map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = field.value === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={cat.label}
                        onClick={() => field.onChange(cat.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                          isSelected
                            ? 'border-[#0F2854] bg-blue-50/80 ring-2 ring-[#0F2854]/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-xl ${
                            isSelected ? 'bg-[#0F2854] text-orange-400' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-[#0F2854] leading-snug">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.userCategory && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.userCategory.message}
              </p>
            )}
          </div>

          {/* Detailed Description + AI Assist + Voice Input */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="description"
                className="block text-xs font-medium text-slate-700"
              >
                Detailed Description <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAiImprove}
                  disabled={aiImproving}
                  aria-label="Enhance draft with AI assistance"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  title="AI will enhance your draft with structured municipal context"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>{aiImproving ? 'Analyzing draft...' : 'AI Assist'}</span>
                </button>
              </div>
            </div>

            {/* Voice Dictation Component */}
            <VoiceInputButton
              currentValue={currentDescription}
              onTranscriptChange={(newVal) => {
                setValue('description', newVal, { shouldValidate: true });
              }}
            />

            <textarea
              id="description"
              rows={4}
              {...register('description')}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                errors.description ? 'border-red-500' : 'border-slate-200 focus:border-[#0F2854]'
              }`}
              placeholder="Provide exact landmarks, estimated dimensions, safety hazards, or affected neighbors. English, தமிழ், or हिन्दी supported."
            />

            {aiImproveNotice && (
              <p
                role="status"
                aria-live="polite"
                className="mt-1 text-xs text-[#0F2854] font-medium"
              >
                {aiImproveNotice}
              </p>
            )}
            {errors.description && (
              <p id="description-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION B: Where Did It Happen? (GPS & Civic Geography) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold text-sm shadow-xs">
                B
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F2854]">
                  Where did it happen?
                </h2>
                <p className="text-xs text-slate-500">
                  Pinpoint the grievance on the map or use your live GPS coordinates.
                </p>
              </div>
            </div>

            {/* GPS Precision & Verification Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                  geoSelection.verificationStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {geoSelection.verificationStatus === 'verified'
                    ? 'Official Boundary Verified'
                    : 'Citizen Specified'}
                </span>
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200">
                ±{Math.round(accuracyMeters)}m
              </span>
            </div>
          </div>

          {/* Interactive Map Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F2854] mb-2">
              Pinpoint Exact Grievance Location on Map <span className="text-red-500">*</span>
            </label>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
              <LocationPickerMap
                initialLat={coords.lat}
                initialLng={coords.lng}
                accuracyMeters={accuracyMeters}
                onLocationSelect={(lat: number, lng: number, acc?: number) => {
                  setCoords({ lat, lng });
                  if (acc) setAccuracyMeters(acc);
                }}
                onAddressDetected={(address: string, detectedWard?: string, structured?: StructuredAddress) => {
                  if (address) {
                    setValue('addressText', address, { shouldValidate: true });
                  }
                  if (detectedWard && !getValues('ward')) {
                    setValue('ward', detectedWard, { shouldValidate: true });
                  }
                  if (structured) {
                    setStructuredAddr(structured);
                    // Dynamically prefill geographic selectors from genuine reverse geocoding
                    setGeoSelection((prev) => ({
                      ...prev,
                      locality: structured.locality || structured.neighbourhood || prev.locality,
                      municipality: structured.villageOrCity || prev.municipality,
                      district: structured.district || prev.district,
                      state: structured.state || prev.state,
                      ward: detectedWard || prev.ward,
                      verificationStatus: 'verified',
                    }));
                  }
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>
                Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} (±{Math.round(accuracyMeters)}m). Drag marker to update address.
              </span>
            </p>
          </div>

          {/* Street Address / Landmark Input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="addressText"
                className="block text-xs font-semibold uppercase tracking-wider text-[#0F2854] mb-1.5"
              >
                Readable Street Address / Landmark <span className="text-red-500">*</span>
              </label>
              <input
                id="addressText"
                type="text"
                {...register('addressText')}
                aria-invalid={Boolean(errors.addressText)}
                aria-describedby={errors.addressText ? 'addressText-error' : undefined}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                  errors.addressText ? 'border-red-500' : 'border-slate-200 focus:border-[#0F2854]'
                }`}
                placeholder="e.g. Near Bus Depot, Anna Nagar Main Road"
              />
              {errors.addressText && (
                <p id="addressText-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.addressText.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="ward"
                className="block text-xs font-semibold uppercase tracking-wider text-[#0F2854] mb-1.5"
              >
                Ward / Electoral Division
              </label>
              <input
                id="ward"
                type="text"
                {...register('ward')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 focus:border-[#0F2854]"
                placeholder="e.g. Ward 50"
              />
            </div>
          </div>

          {/* Cascading Geographic Hierarchy Selector */}
          <GeographicHierarchySelector
            value={geoSelection}
            onChange={(newSelection) => {
              setGeoSelection(newSelection);
              if (newSelection.ward && !getValues('ward')) {
                setValue('ward', newSelection.ward);
              }
            }}
          />

          {/* Automatically Populated Structured Fields Panel */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F2854] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-orange-500" />
                <span>Resolved Address Breakdown</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDetailedAddressFields(!showDetailedAddressFields)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 underline"
              >
                {showDetailedAddressFields ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {showDetailedAddressFields && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Building / Door #</span>
                  <input
                    type="text"
                    value={structuredAddr.houseNumber || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, houseNumber: e.target.value })}
                    placeholder="Not available"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Street / Road</span>
                  <input
                    type="text"
                    value={structuredAddr.street || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, street: e.target.value })}
                    placeholder="Not available"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Locality</span>
                  <input
                    type="text"
                    value={geoSelection.locality || structuredAddr.locality || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, locality: e.target.value })}
                    placeholder="Not available"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">City / Town</span>
                  <input
                    type="text"
                    value={geoSelection.municipality || structuredAddr.villageOrCity || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, villageOrCity: e.target.value })}
                    placeholder="Not available"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">District</span>
                  <input
                    type="text"
                    value={geoSelection.district || structuredAddr.district || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, district: e.target.value })}
                    placeholder="Not available"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">State</span>
                  <input
                    type="text"
                    value={geoSelection.state || structuredAddr.state || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, state: e.target.value })}
                    placeholder="Tamil Nadu"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">PIN Code</span>
                  <input
                    type="text"
                    value={structuredAddr.postalCode || ''}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, postalCode: e.target.value })}
                    placeholder="Not available"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Country</span>
                  <input
                    type="text"
                    value={structuredAddr.country || 'India'}
                    onChange={(e) => setStructuredAddr({ ...structuredAddr, country: e.target.value })}
                    placeholder="India"
                    className="w-full font-medium text-slate-900 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION C: Evidence Upload */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold text-sm">
              C
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F2854]">
                Photo Evidence
              </h2>
              <p className="text-xs text-slate-500">
                Attach photographic proof for AI verification and accelerated inspection.
              </p>
            </div>
          </div>

          <ImageUploadZone
            selectedFile={selectedImage}
            onImageSelected={(file: File | null) => setSelectedImage(file)}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/citizen/dashboard')}
            className="w-full sm:w-auto text-slate-600 hover:text-[#0F2854]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full sm:w-auto bg-[#0F2854] hover:bg-[#1C4D8D] text-white shadow-md flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering Grievance & Dispatching AI...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-orange-400" />
                <span>Submit Grievance for Resolution</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
