"use client";

import type React from "react";
import { useState } from "react";
import {
  CheckCircle,
  X,
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Building,
  Globe,
  Briefcase,
  Tag,
  Package,
  TrendingUp,
  Activity,
  AlertCircle,
  Save,
} from "lucide-react";

const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-6xl max-h-[95vh] mx-4">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300">
    {children}
  </div>
);

const DialogHeader = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) => (
  <div className="relative px-8 py-4 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/90 via-purple-50/90 to-indigo-50/90" />
    <div className="relative">
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  </div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl font-bold text-gray-800 mb-3 flex items-center gap-3">
    <div className="p-2 bg-white/60 rounded-xl">
      <User className="h-6 w-6" />
    </div>
    {children}
  </h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-600 text-lg">{children}</p>
);

const Input = ({ label, icon: Icon, error, className = "", ...props }: any) => (
  <div className="space-y-2">
    {label && (
      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </label>
    )}
    <input
      className={`
        w-full px-4 py-3 rounded-xl border border-gray-200 
        focus:ring-2 focus:ring-purple-500 focus:border-transparent
        transition-all duration-200 bg-white
        placeholder:text-gray-400
        hover:border-gray-300 hover:shadow-sm
        ${error ? "border-red-300 focus:ring-red-500" : ""}
        ${className}
      `}
      {...props}
    />
    {error && (
      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

const Button = ({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: any) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300",
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3
        ${variants[variant]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

const Select = ({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  icon: Icon,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option: any) => option.value === value);

  return (
    <div className="relative space-y-2">
      {label && (
        <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-left focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 hover:shadow-sm flex items-center justify-between"
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((option: any) => (
            <button
              key={option.value}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface Client {
  id: string;
  name: string;
  email?: string;
  birthdate?: string;
  company?: string;
  designation?: string;
  location?: string;
  phone?: string;
  companywebsite?: string;
  companyaddress?: string;
  status?: string;
  category?: string;
  startDate?: string | null;
  dueDate?: string | null;
  packageId?: string;
  progress?: number;
}

interface ClientEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  setClient: (client: Client) => void;
  refreshClients: () => Promise<void>;
}

export function ClientEditModal({
  isOpen,
  onOpenChange,
  client,
  setClient,
  refreshClients,
}: ClientEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const statusOptions = [
    { value: "active", label: "🟢 Active" },
    { value: "inactive", label: "🔴 Inactive" },
    { value: "pending", label: "🟡 Pending" },
    { value: "completed", label: "✅ Completed" },
    { value: "on-hold", label: "⏸️ On Hold" },
  ];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Basic validation
    if (!client.name.trim()) {
      setError("Client name is required");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });

      if (!response.ok) throw new Error("Failed to update client");

      const updatedClient: Client = await response.json();
      setClient(updatedClient);

      // Show success notification
      console.log("Client updated successfully");

      await refreshClients();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating client:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update client"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>✨ Edit Client Profile</DialogTitle>
          <DialogDescription>
            Update client information and project details with our comprehensive
            form
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-25 border border-red-100 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="p-4 space-y-8">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-br from-blue-25 to-indigo-25 rounded-2xl p-6 border border-blue-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  icon={User}
                  value={client.name}
                  onChange={(e: any) =>
                    setClient({ ...client, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  required
                />

                <Input
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={client.email || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />

                <Input
                  label="Birth Date"
                  icon={Calendar}
                  type="date"
                  value={formatDateForInput(client.birthdate)}
                  onChange={(e: any) =>
                    setClient({ ...client, birthdate: e.target.value })
                  }
                />

                <Input
                  label="Phone Number"
                  icon={Phone}
                  value={client.phone || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Location"
                    icon={MapPin}
                    value={client.location || ""}
                    onChange={(e: any) =>
                      setClient({ ...client, location: e.target.value })
                    }
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="bg-gradient-to-br from-emerald-25 to-teal-25 rounded-2xl p-6 border border-emerald-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Company Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company Name"
                  icon={Building}
                  value={client.company || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, company: e.target.value })
                  }
                  placeholder="Enter company name"
                />

                <Input
                  label="Job Title"
                  icon={Briefcase}
                  value={client.designation || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, designation: e.target.value })
                  }
                  placeholder="Enter job title"
                />

                <Input
                  label="Company Website"
                  icon={Globe}
                  type="url"
                  value={client.companywebsite || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, companywebsite: e.target.value })
                  }
                  placeholder="https://company.com"
                />

                <Input
                  label="Category"
                  icon={Tag}
                  value={client.category || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, category: e.target.value })
                  }
                  placeholder="Enter category"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Company Address"
                    icon={MapPin}
                    value={client.companyaddress || ""}
                    onChange={(e: any) =>
                      setClient({ ...client, companyaddress: e.target.value })
                    }
                    placeholder="Enter company address"
                  />
                </div>
              </div>
            </div>

            {/* Project Information Section */}
            <div className="bg-gradient-to-br from-purple-25 to-pink-25 rounded-2xl p-6 border border-purple-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Project Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Start Date"
                  icon={Calendar}
                  type="date"
                  value={formatDateForInput(client.startDate)}
                  onChange={(e: any) =>
                    setClient({
                      ...client,
                      startDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />

                <Input
                  label="Due Date"
                  icon={Calendar}
                  type="date"
                  value={formatDateForInput(client.dueDate)}
                  onChange={(e: any) =>
                    setClient({
                      ...client,
                      dueDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />

                <Input
                  label="Package ID"
                  icon={Package}
                  value={client.packageId || ""}
                  onChange={(e: any) =>
                    setClient({ ...client, packageId: e.target.value })
                  }
                  placeholder="Enter package ID"
                />

                <Select
                  value={client.status || ""}
                  onValueChange={(value: string) =>
                    setClient({ ...client, status: value })
                  }
                  options={statusOptions}
                  label="Project Status"
                  icon={Activity}
                  placeholder="Select status"
                />

                <div className="md:col-span-2">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Progress Percentage
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={client.progress || 0}
                      onChange={(e: any) =>
                        setClient({
                          ...client,
                          progress: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter progress percentage"
                    />
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-400 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${client.progress || 0}%` }}
                      >
                        {(client.progress || 0) > 10 && (
                          <span className="text-white text-xs font-semibold">
                            {client.progress || 0}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center font-medium">
                      {client.progress || 0}% Complete
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={saving || !client.name.trim()}
            loading={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
