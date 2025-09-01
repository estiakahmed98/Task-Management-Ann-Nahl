"use client";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 shadow-lg"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
        </div>
        <p className="text-2xl font-bold text-gray-800 mb-3">
          Loading Tasks
        </p>
        <p className="text-gray-600 font-medium">
          Fetching client tasks and organizing by categories with advanced sorting...
        </p>
      </div>
    </div>
  );
}
