import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  FileCheck,
  Check,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.js';

interface CivicNotification {
  id: string;
  type: 'status_update' | 'reward' | 'verification' | 'system';
  title: string;
  message: string;
  publicId?: string;
  timestamp: string;
  read: boolean;
}

export const NotificationsPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'rewards'>('all');
  const [notifications, setNotifications] = useState<CivicNotification[]>([
    {
      id: 'notif-1',
      type: 'verification',
      title: 'Action Required: Confirm Resolution on Pothole',
      message: 'Repair crews have uploaded completion photos for CR-2026-001249. Please confirm that the surface is restored.',
      publicId: 'CR-2026-001249',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'reward',
      title: 'ResolveRewards™ Multiplier: +50 Credits Earned',
      message: 'Your report on Anna Salai was verified with high life-safety severity. 50 civic credits have been deposited into your wallet.',
      timestamp: '5 hours ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'status_update',
      title: 'Field Team Dispatched for Broken Streetlight',
      message: 'Electrical Department has assigned crew #14 to replace faulty fixtures on 4th Main Road.',
      publicId: 'CR-2026-001252',
      timestamp: '1 day ago',
      read: true,
    },
    {
      id: 'notif-4',
      type: 'system',
      title: 'Monsoon Municipal Advisory',
      message: 'Drainage inspections are underway across Zones 1-15. Report any water accumulation immediately.',
      timestamp: '2 days ago',
      read: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'rewards') return n.type === 'reward';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F2854] text-orange-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2854]">
              Notifications & Alerts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time status updates, field crew milestones, and ResolveRewards™ credit statements.
          </p>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors shrink-0"
        >
          <Check className="w-3.5 h-3.5 text-orange-500" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread (${notifications.filter((n) => !n.read).length})` },
          { id: 'rewards', label: 'Reward Deposits' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full transition-colors ${
              filter === tab.id
                ? 'bg-[#0F2854] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-card space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-[#0F2854]">No Notifications</h3>
            <p className="text-xs text-slate-500">You are all caught up with your municipal alerts.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                item.read
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-blue-50/50 border-blue-200 text-slate-900 shadow-xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  item.type === 'reward'
                    ? 'bg-orange-100 text-orange-600'
                    : item.type === 'verification'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-[#0F2854]'
                }`}
              >
                {item.type === 'reward' ? (
                  <Sparkles className="w-5 h-5" />
                ) : item.type === 'verification' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-[#0F2854]">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                {item.publicId && (
                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      to={`/track?id=${item.publicId}`}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Track Grievance {item.publicId}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {!item.read && (
                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
