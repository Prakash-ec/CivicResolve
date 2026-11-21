import { auth } from './firebase.js';
import {
  HotspotCluster,
  WardMetric,
  CivicRecommendation,
  EvidenceVerification,
  CommunityIssue,
} from '../types/index.js';

/**
 * Resolves and normalizes the API base URL.
 * Strips trailing slashes, prevents duplicate /api prefixes,
 * and provides safe environment-aware defaults.
 */
export function getNormalizedBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  // Safe production fallback: deployed backend on Render
  if (import.meta.env.PROD) {
    return 'https://civicresolve-m93a.onrender.com/api';
  }
  // Local development fallback: Vite proxy /api -> http://localhost:5000/api
  return '/api';
}

export const API_BASE_URL = getNormalizedBaseUrl();

/**
 * Builds a clean, fully-qualified or proxied API URL.
 * Guarantees no duplicate // slashes or duplicate /api segments.
 */
export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const base = getNormalizedBaseUrl();
  let cleanEndpoint = endpoint.trim();

  // Ensure single leading slash on endpoint
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }

  // Prevent duplicate /api segment if base ends with /api and endpoint starts with /api/
  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }

  return `${base}${cleanEndpoint}`;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers = {}, ...rest } = options;

  let url = buildApiUrl(endpoint);
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Inject current Firebase Auth ID token if available
  const authHeaders: Record<string, string> = {};
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      authHeaders['Authorization'] = `Bearer ${token}`;
    } catch {
      // Continue without token if retrieval fails
    }
  }

  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...authHeaders,
  };

  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        requestHeaders[key] = value;
      });
    } else {
      Object.assign(requestHeaders, headers);
    }
  }

  // Ensure Content-Type is NEVER manually passed for FormData to allow browser boundary calculation
  if (isFormData) {
    delete requestHeaders['Content-Type'];
    delete requestHeaders['content-type'];
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = data.error || {
      code: 'HTTP_ERROR',
      message: data.message || `Request failed with status ${response.status}`,
      fieldErrors: data.fieldErrors || {},
    };
    throw errorPayload;
  }

  return data as T;
}

// Health check API
export async function checkBackendHealth() {
  return apiClient<{
    status: string;
    service: string;
    version: string;
    timestamp: string;
    environment: string;
    integrations: Record<string, any>;
  }>('/health');
}

// Public API Service
export const publicService = {
  getPublicStats: async () => {
    return apiClient<{ success: boolean; data: any }>('/complaints/public-stats');
  },
  getPublicFeed: async (limit = 8) => {
    return apiClient<{ success: boolean; data: any[] }>(`/complaints/public-feed?limit=${limit}`);
  },
  trackComplaint: async (publicId: string) => {
    return apiClient<{ success: boolean; complaint: any; timeline: any[] }>(
      `/complaints/track/${encodeURIComponent(publicId)}`
    );
  },
  getMapPoints: async (filters: { category?: string; status?: string; ward?: string } = {}) => {
    const query = new URLSearchParams();
    if (filters.category && filters.category !== 'all') query.set('category', filters.category);
    if (filters.status && filters.status !== 'all') query.set('status', filters.status);
    if (filters.ward && filters.ward !== 'all') query.set('ward', filters.ward);
    return apiClient<{ success: boolean; points: any[] }>(
      `/complaints/map-points${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  upvoteComplaint: async (id: string) => {
    return apiClient<{ success: boolean; upvotes: number }>(`/complaints/${id}/vote`, {
      method: 'POST',
    });
  },
  getAccountability: async () => {
    return apiClient<{
      success: boolean;
      citySummary: {
        totalGrievances: number;
        resolvedGrievances: number;
        inProgressGrievances: number;
        pendingReviewGrievances: number;
        resolutionRate: number;
        avgResolutionHours: number;
        slaComplianceRate: number;
        activeWardsCovered: number;
        lastUpdated: string;
      };
      wardPerformance: Array<{
        ward: string;
        total: number;
        resolved: number;
        inProgress: number;
        critical: number;
        resolutionRate: number;
        riskLevel: string;
      }>;
      departmentPerformance: Array<{
        departmentId: string;
        departmentName: string;
        activeCount: number;
        resolvedCount: number;
        overdueCount: number;
        slaComplianceRatePercent: number;
        averageResolutionHours: number;
        capacityStatus: string;
      }>;
    }>('/public/accountability');
  },
};

// Admin Governance Service
export const adminService = {
  getOverview: async () => {
    return apiClient<{ success: boolean; overview: any }>('/admin/overview');
  },
  getComplaints: async (params: {
    status?: string;
    priority?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.department) query.set('department', params.department);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return apiClient<{
      success: boolean;
      complaints: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        pageSize: number;
      };
    }>(`/admin/complaints?${query.toString()}`);
  },
  getComplaintById: async (id: string) => {
    return apiClient<{ success: boolean; complaint: any; timeline: any[] }>(
      `/admin/complaints/${id}`
    );
  },
  updateComplaint: async (id: string, payload: any) => {
    return apiClient<{ success: boolean; complaint: any; message: string }>(
      `/admin/complaints/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },
  bulkAssign: async (payload: {
    complaintIds: string[];
    status?: string;
    departmentId?: string;
    officerName?: string;
    priorityLevel?: string;
    note?: string;
  }) => {
    return apiClient<{
      success: boolean;
      updatedCount: number;
      complaints: any[];
      message: string;
    }>('/admin/complaints/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  exportCsv: async () => {
    const targetUrl = buildApiUrl('/admin/complaints/export/csv');
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: auth.currentUser ? `Bearer ${await auth.currentUser.getIdToken()}` : '',
      },
    });
    return res.blob();
  },
  getAuditLogs: async () => {
    return apiClient<{
      success: boolean;
      totalLogs: number;
      logs: any[];
    }>('/admin/audit-logs');
  },
  getRecurringIssues: async () => {
    return apiClient<{
      success: boolean;
      totalRecurringClusters: number;
      patterns: any[];
    }>('/admin/intelligence/recurring');
  },
  getRiskIndex: async (ward?: string) => {
    const url = ward ? `/admin/intelligence/risk-index?ward=${encodeURIComponent(ward)}` : '/admin/intelligence/risk-index';
    return apiClient<{
      success: boolean;
      assessment: any;
    }>(url);
  },
  getDepartmentWorkload: async () => {
    return apiClient<{
      success: boolean;
      workloads: any[];
    }>('/admin/workload');
  },
  getAnalytics: async () => {
    return apiClient<{ success: boolean; data: any }>('/admin/analytics');
  },
};

// Civic Intelligence Service
export const intelligenceService = {
  getOverview: async () => {
    return apiClient<{
      success: boolean;
      overview: {
        cityHealthIndex: number;
        activeClustersCount: number;
        criticalHotspotsCount: number;
        activeWardsCount: number;
        recommendationsCount: number;
        totalUnresolvedIssues: number;
      };
    }>('/admin/intelligence/overview');
  },
  getHotspots: async (radius = 150) => {
    return apiClient<{
      success: boolean;
      radiusMeters: number;
      totalClusters: number;
      clusters: HotspotCluster[];
    }>(`/admin/intelligence/hotspots?radius=${radius}`);
  },
  getWards: async () => {
    return apiClient<{
      success: boolean;
      totalWards: number;
      wards: WardMetric[];
    }>('/admin/intelligence/wards');
  },
  getRecommendations: async () => {
    return apiClient<{
      success: boolean;
      total: number;
      recommendations: CivicRecommendation[];
    }>('/admin/intelligence/recommendations');
  },
  getGeographicAnalytics: async (filters: {
    state?: string;
    district?: string;
    municipality?: string;
    zone?: string;
    ward?: string;
    block?: string;
    locality?: string;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'all') query.set(k, v);
    });
    return apiClient<{
      success: boolean;
      analytics: any;
    }>(`/admin/intelligence/geographic?${query.toString()}`);
  },
};

// Multimodal Evidence Service
export const evidenceService = {
  verifyEvidence: async (complaintId: string) => {
    return apiClient<{
      success: boolean;
      complaintId: string;
      publicId: string;
      verification: EvidenceVerification;
    }>(`/admin/complaints/${complaintId}/verify-evidence`, {
      method: 'POST',
    });
  },
  getEvidenceAnalysis: async (complaintId: string) => {
    return apiClient<{
      success: boolean;
      complaintId: string;
      publicId: string;
      verification: EvidenceVerification;
    }>(`/admin/complaints/${complaintId}/evidence-analysis`);
  },
};

// Community Issues Service
export const communityService = {
  getNearbyIssues: async (lat: number, lng: number, radius = 2500, category?: string) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
    });
    if (category && category !== 'all') params.set('category', category);
    return apiClient<{
      success: boolean;
      total: number;
      issues: CommunityIssue[];
    }>(`/community/issues/nearby?${params.toString()}`);
  },
  confirmIssue: async (id: string) => {
    return apiClient<{
      success: boolean;
      message: string;
      communityConfirmationsCount: number;
      creditsAwarded: number;
    }>(`/community/issues/${id}/confirm`, {
      method: 'POST',
    });
  },
  checkDuplicate: async (lat: number, lng: number, category?: string) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    if (category) params.set('category', category);
    return apiClient<{
      success: boolean;
      duplicateFound: boolean;
      candidate?: {
        id: string;
        publicId: string;
        title: string;
        category: string;
        distanceMeters: number;
      };
    }>(`/community/issues/check-duplicate?${params.toString()}`);
  },
};

// Citizen Service
export const citizenService = {
  getMyComplaints: async () => {
    return apiClient<{ success: boolean; complaints: any[] }>('/complaints/mine');
  },
  submitComplaint: async (payload: FormData | any) => {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    return apiClient<{
      success: boolean;
      complaint: any;
      publicId: string;
      complaintId: string;
      storageNotice?: string;
    }>('/complaints', {
      method: 'POST',
      body: isForm ? payload : JSON.stringify(payload),
    });
  },
  verifyResolution: async (id: string, rating: number = 5, feedback?: string) => {
    return apiClient<{ success: boolean; complaint: any; message: string }>(
      `/complaints/${id}/verify-resolution`,
      {
        method: 'POST',
        body: JSON.stringify({ rating, feedback }),
      }
    );
  },
  reopenComplaint: async (id: string, reopenReason: string) => {
    return apiClient<{ success: boolean; complaint: any; message: string }>(
      `/complaints/${id}/reopen`,
      {
        method: 'POST',
        body: JSON.stringify({ reopenReason }),
      }
    );
  },
  getReceipt: async (id: string) => {
    return apiClient<{ success: boolean; receipt: any }>(`/complaints/${id}/receipt`);
  },
  getNotifications: async () => {
    return apiClient<{ success: boolean; notifications: any[]; unreadCount: number }>(
      '/citizen/notifications'
    );
  },
  markNotificationRead: async (notifId: string) => {
    return apiClient<{ success: boolean }>(`/citizen/notifications/${notifId}/read`, {
      method: 'PATCH',
    });
  },
};

// Multilingual AI Civic Assistant Service
export const aiCivicService = {
  chat: async (payload: {
    message: string;
    history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    language?: 'en' | 'ta' | 'hi' | 'te' | 'kn';
    complaintContext?: {
      publicId?: string;
      category?: string;
      status?: string;
      slaHoursRemaining?: number;
      department?: string;
    };
  }) => {
    return apiClient<{
      success: boolean;
      reply: string;
      language: string;
      quickReplies: string[];
      suggestedCategory?: string;
      suggestedAction?: 'report' | 'track' | 'escalate' | 'reopen' | 'verify';
      provider: string;
    }>('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
