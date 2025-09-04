// "use client";
// import * as React from "react";

// export type TaskHistoryRow = {
//   id: string;
//   name: string;
//   clientName: string;
//   status: string;
//   date: string; // ISO
//   performanceRating: number | null;
//   idealDurationMinutes: number | null;
//   actualDurationMinutes: number | null;
// };

// function formatDate(iso: string) {
//   try {
//     return new Intl.DateTimeFormat(undefined, {
//       year: "numeric",
//       month: "short",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//     }).format(new Date(iso));
//   } catch {
//     return iso;
//   }
// }

// function formatMinutes(m: number | null | undefined) {
//   if (m == null) return "—";
//   const h = Math.floor(m / 60);
//   const min = m % 60;
//   if (h <= 0) return `${min}m`;
//   if (min === 0) return `${h}h`;
//   return `${h}h ${min}m`;
// }

// function diffBadge(actual: number | null | undefined, ideal: number | null | undefined) {
//   if (actual == null || ideal == null) return <span className="text-gray-400">—</span>;
//   const delta = actual - ideal;
//   const abs = Math.abs(delta);
//   const label = `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatMinutes(abs)}`;
//   const base = "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium";
//   if (delta > 0) {
//     return <span className={`${base} bg-red-100 text-red-800`}>{label}</span>;
//   }
//   if (delta < 0) {
//     return <span className={`${base} bg-green-100 text-green-800`}>{label}</span>;
//   }
//   return <span className={`${base} bg-gray-100 text-gray-800`}>on time</span>;
// }

// function ratingBar(rating: number | null) {
//   if (rating == null) return <span className="text-gray-400">—</span>;
//   const max = rating <= 5 ? 5 : 10;
//   const pct = Math.max(0, Math.min(100, (rating / max) * 100));
  
//   let colorClass = "bg-amber-500";
//   if (pct >= 80) colorClass = "bg-green-500";
//   if (pct <= 40) colorClass = "bg-red-500";
  
//   return (
//     <div className="flex items-center gap-2 min-w-[120px]">
//       <div className="relative h-2 w-28 rounded-full bg-gray-100 overflow-hidden">
//         <div
//           className={`absolute left-0 top-0 h-2 rounded-full ${colorClass}`}
//           style={{ width: `${pct}%` }}
//         />
//       </div>
//       <span className="text-xs tabular-nums text-gray-600 font-medium">
//         {rating}/{max}
//       </span>
//     </div>
//   );
// }

// export default function TaskHistory({ rows }: { rows: TaskHistoryRow[] }) {
//   // Small summary
//   const total = rows.length;
//   const ratings = rows.filter(r => r.performanceRating != null);
//   const avgRating = ratings.length ? 
//     ratings.reduce((s, r) => s + (r.performanceRating || 0), 0) / ratings.length : 0;

//   const ideals = rows.filter(r => r.idealDurationMinutes != null);
//   const avgIdeal = ideals.length ? 
//     ideals.reduce((s, r) => s + (r.idealDurationMinutes || 0), 0) / ideals.length : 0;

//   const actuals = rows.filter(r => r.actualDurationMinutes != null);
//   const avgActual = actuals.length ? 
//     actuals.reduce((s, r) => s + (r.actualDurationMinutes || 0), 0) / actuals.length : 0;

//   const efficiency = avgIdeal && avgActual ? ((avgIdeal / avgActual) * 100) : 0;

//   return (
//     <div className="w-full p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-6 border-b border-gray-200 pb-4">
//         <h1 className="text-2xl font-bold text-gray-900">Quality Control Task History</h1>
//         <p className="text-sm text-gray-600 mt-1">
//           Overview of all tasks with <span className="font-medium text-blue-600">QC Approved</span> status
//         </p>
//       </div>

//       {/* Summary Cards */}
//       <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
//           <div className="flex items-center">
//             <div className="rounded-full bg-blue-100 p-2 mr-3">
//               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-gray-600">Total Tasks</p>
//               <p className="text-2xl font-bold text-gray-900">{total}</p>
//             </div>
//           </div>
//         </div>

//         <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
//           <div className="flex items-center">
//             <div className="rounded-full bg-amber-100 p-2 mr-3">
//               <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {isFinite(avgRating) ? avgRating.toFixed(1) : "0.0"}
//                 <span className="text-sm font-normal text-gray-500 ml-1">/ {avgRating <= 5 ? 5 : 10}</span>
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
//           <div className="flex items-center">
//             <div className="rounded-full bg-purple-100 p-2 mr-3">
//               <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
//               <p className="text-lg font-bold text-gray-900">
//                 {isFinite(avgActual) ? formatMinutes(Math.round(avgActual)) : "—"}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
//           <div className="flex items-center">
//             <div className="rounded-full bg-green-100 p-2 mr-3">
//               <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-gray-600">Efficiency</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {isFinite(efficiency) ? efficiency.toFixed(0) : "0"}%
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Task
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
//                 Client
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
//                 Date
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Ideal
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actual
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Δ Time
//               </th>
//               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Rating
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {rows.length === 0 ? (
//               <tr>
//                 <td colSpan={8} className="px-6 py-8 text-center">
//                   <div className="flex flex-col items-center justify-center text-gray-400">
//                     <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="text-sm">No QC approved tasks found</p>
//                   </div>
//                 </td>
//               </tr>
//             ) : (
//               rows.map((r) => (
//                 <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="font-medium text-gray-900">{r.name}</div>
//                     <div className="text-xs text-gray-500 sm:hidden mt-1">
//                       {r.clientName} • {formatDate(r.date)}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-gray-600 hidden sm:table-cell">
//                     {r.clientName}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
//                       {r.status.replaceAll("_", " ")}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-gray-600 hidden md:table-cell">
//                     {formatDate(r.date)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-gray-600 tabular-nums">
//                     {formatMinutes(r.idealDurationMinutes ?? null)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-gray-600 tabular-nums">
//                     {formatMinutes(r.actualDurationMinutes ?? null)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {diffBadge(r.actualDurationMinutes, r.idealDurationMinutes)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {ratingBar(r.performanceRating)}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Legend and Info */}
//       <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500">
//         <div className="mb-2 sm:mb-0">
//           <span className="font-medium mr-2">Legend:</span>
//           <span className="text-green-700 font-medium mr-3">− = finished faster</span>
//           <span className="text-red-700 font-medium">+ = overrun</span>
//         </div>
//         <div>
//           Showing {rows.length} of {rows.length} tasks
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import * as React from "react";
import { useState, useMemo } from "react";

export type TaskHistoryRow = {
  id: string;
  name: string;
  clientName: string;
  status: string;
  date: string; // ISO
  performanceRating: number | null;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatMinutes(m: number | null | undefined) {
  if (m == null) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h <= 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

function diffBadge(actual: number | null | undefined, ideal: number | null | undefined) {
  if (actual == null || ideal == null) return <span className="text-gray-400">—</span>;
  const delta = actual - ideal;
  const abs = Math.abs(delta);
  const label = `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${formatMinutes(abs)}`;
  const base = "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium";
  if (delta > 0) {
    return <span className={`${base} bg-red-100 text-red-800`}>{label}</span>;
  }
  if (delta < 0) {
    return <span className={`${base} bg-green-100 text-green-800`}>{label}</span>;
  }
  return <span className={`${base} bg-gray-100 text-gray-800`}>on time</span>;
}

function ratingBar(rating: number | null) {
  if (rating == null) return <span className="text-gray-400">—</span>;
  const max = rating <= 5 ? 5 : 10;
  const pct = Math.max(0, Math.min(100, (rating / max) * 100));
  
  let colorClass = "bg-amber-500";
  if (pct >= 80) colorClass = "bg-green-500";
  if (pct <= 40) colorClass = "bg-red-500";
  
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="relative h-2 w-28 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-2 rounded-full ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-600 font-medium">
        {rating}/{max}
      </span>
    </div>
  );
}

export default function TaskHistory({ rows }: { rows: TaskHistoryRow[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("qc_approved,completed");
  const [taskNameFilter, setTaskNameFilter] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);
  
  // Get unique statuses for filter options
  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(rows.map(row => row.status)));
    return statuses.map(status => ({
      value: status,
      label: status.replaceAll("_", " "),
      count: rows.filter(row => row.status === status).length
    }));
  }, [rows]);
  
  // Filter rows based on filters
  const filteredRows = useMemo(() => {
    let filtered = rows;
    
    // Apply status filter
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      filtered = filtered.filter(row => statuses.includes(row.status));
    }
    
    // Apply task name filter
    if (taskNameFilter) {
      const searchTerm = taskNameFilter.toLowerCase();
      filtered = filtered.filter(row => 
        row.name.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, [rows, statusFilter, taskNameFilter]);
  
  // Calculate statistics based on filtered rows
  const total = filteredRows.length;
  
  const ratings = filteredRows.filter(r => r.performanceRating != null);
  const avgRating = ratings.length ? 
    ratings.reduce((s, r) => s + (r.performanceRating || 0), 0) / ratings.length : 0;

  const ideals = filteredRows.filter(r => r.idealDurationMinutes != null);
  const avgIdeal = ideals.length ? 
    ideals.reduce((s, r) => s + (r.idealDurationMinutes || 0), 0) / ideals.length : 0;

  const actuals = filteredRows.filter(r => r.actualDurationMinutes != null);
  const avgActual = actuals.length ? 
    actuals.reduce((s, r) => s + (r.actualDurationMinutes || 0), 0) / actuals.length : 0;

  // Calculate efficiency correctly (not over 100%)
  const efficiency = avgIdeal && avgActual ? 
    Math.min(100, (avgIdeal / avgActual) * 100) : 0;

  return (
    <div className="w-full p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task History Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Overview of tasks with selected status
            </p>
          </div>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 bg-white shadow-sm"
          >
            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            <svg 
              className={`ml-1 h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="mb-6 bg-white rounded-lg border border-gray-300 shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Tasks
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Task Name Search */}
            <div>
              <label htmlFor="taskNameFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Search Tasks
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="taskNameFilter"
                  value={taskNameFilter}
                  onChange={(e) => setTaskNameFilter(e.target.value)}
                  placeholder="Search by task name..."
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {taskNameFilter && (
                  <button
                    onClick={() => setTaskNameFilter("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter - Enhanced with better styling */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full py-2.5 pl-10 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
                >
                  <option value="qc_approved,completed">QC Approved & Completed</option>
                  <option value="qc_approved">QC Approved Only</option>
                  <option value="completed">Completed Only</option>
                  <option value="">All Statuses</option>
                  <optgroup label="Specific Statuses">
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Filters Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {taskNameFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                Task: {taskNameFilter}
                <button
                  onClick={() => setTaskNameFilter("")}
                  className="ml-1.5 rounded-full flex-shrink-0 flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none p-0.5"
                >
                  <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                  </svg>
                </button>
              </span>
            )}
            
            {statusFilter && statusFilter.split(',').map(status => {
              const statusLabel = statusOptions.find(opt => opt.value === status)?.label || status;
              return (
                <span key={status} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Status: {statusLabel.replaceAll("_", " ")}
                  <button
                    onClick={() => {
                      const newStatuses = statusFilter.split(',').filter(s => s !== status);
                      setStatusFilter(newStatuses.join(','));
                    }}
                    className="ml-1.5 rounded-full flex-shrink-0 flex items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none p-0.5"
                  >
                    <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-2 mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-amber-100 p-2 mr-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {isFinite(avgRating) ? avgRating.toFixed(1) : "0.0"}
                <span className="text-sm font-normal text-gray-500 ml-1">/ {avgRating <= 5 ? 5 : 10}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-2 mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
              <p className="text-lg font-bold text-gray-900">
                {isFinite(avgActual) ? formatMinutes(Math.round(avgActual)) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-2 mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {isFinite(efficiency) ? efficiency.toFixed(0) : "0"}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ideal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Δ Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No tasks found with current filters</p>
                    {(taskNameFilter || statusFilter) && (
                      <button
                        onClick={() => {
                          setTaskNameFilter("");
                          setStatusFilter("qc_approved,completed");
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500 sm:hidden mt-1">
                      {r.clientName} • {formatDate(r.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 hidden sm:table-cell">
                    {r.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      r.status === 'qc_approved' 
                        ? 'bg-blue-100 text-blue-800' 
                        : r.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {r.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 hidden md:table-cell">
                    {formatDate(r.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 tabular-nums">
                    {formatMinutes(r.idealDurationMinutes ?? null)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 tabular-nums">
                    {formatMinutes(r.actualDurationMinutes ?? null)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {diffBadge(r.actualDurationMinutes, r.idealDurationMinutes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ratingBar(r.performanceRating)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend and Info */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500">
        <div className="mb-2 sm:mb-0">
          <span className="font-medium mr-2">Legend:</span>
          <span className="text-green-700 font-medium mr-3">− = finished faster</span>
          <span className="text-red-700 font-medium">+ = overdue</span>
        </div>
        <div>
          Showing {filteredRows.length} of {rows.length} tasks
        </div>
      </div>
    </div>
  );
}