import { Users, Globe, Building2 } from 'lucide-react';

export const priorityColors = {
  low: "bg-gradient-to-r from-emerald-100 via-teal-50 to-green-100 text-emerald-800 border-emerald-300 shadow-emerald-100",
  medium: "bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 text-amber-800 border-amber-300 shadow-amber-100",
  high: "bg-gradient-to-r from-orange-100 via-red-50 to-rose-100 text-orange-800 border-orange-300 shadow-orange-100",
  urgent: "bg-gradient-to-r from-red-100 via-rose-50 to-pink-100 text-red-800 border-red-300 shadow-red-100",
};

export const statusColors = {
  pending: "bg-gradient-to-r from-slate-100 via-gray-50 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-100",
  in_progress: "bg-gradient-to-r from-blue-100 via-indigo-50 to-sky-100 text-blue-800 border-blue-300 shadow-blue-100",
  completed: "bg-gradient-to-r from-emerald-100 via-green-50 to-teal-100 text-emerald-800 border-emerald-300 shadow-emerald-100",
  overdue: "bg-gradient-to-r from-red-100 via-rose-50 to-pink-100 text-red-800 border-red-300 shadow-red-100",
  cancelled: "bg-gradient-to-r from-slate-100 via-gray-50 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-100",
};

export const siteTypeIcons = {
  social_site: Users,
  web2_site: Globe,
  other_asset: Building2,
};

export const siteTypeColors = {
  social_site: "bg-gradient-to-r from-violet-100 via-purple-50 to-fuchsia-100 text-violet-800 border-violet-300 shadow-violet-100",
  web2_site: "bg-gradient-to-r from-blue-100 via-cyan-50 to-sky-100 text-blue-800 border-blue-300 shadow-blue-100",
  other_asset: "bg-gradient-to-r from-slate-100 via-gray-50 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-100",
};
