"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Package, FileText, Calendar, AlertCircle } from "lucide-react";

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newPackage: {
    name: string;
    description?: string;
    totalMonths?: number;
  }) => void;
  isEdit?: boolean;
  initialData?: {
    id: string;
    name: string;
    description?: string;
    totalMonths?: number;
  };
  onUpdate?: (
    id: string,
    updatedPackage: { name: string; description?: string; totalMonths?: number }
  ) => void;
}

export function AddPackageModal({
  isOpen,
  onClose,
  onAdd,
  isEdit = false,
  initialData,
  onUpdate,
}: AddPackageModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalMonths, setTotalMonths] = useState<number | "">("");
  const [errors, setErrors] = useState<{
    name?: string;
    totalMonths?: string;
  }>({});

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setTotalMonths(initialData.totalMonths ?? "");
    } else {
      setName("");
      setDescription("");
      setTotalMonths("");
    }
    setErrors({});
  }, [isOpen, isEdit, initialData]);

  const validateForm = () => {
    const newErrors: { name?: string; totalMonths?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Package name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Package name must be at least 2 characters";
    }

    if (
      totalMonths !== "" &&
      (Number(totalMonths) < 1 || Number(totalMonths) > 120)
    ) {
      newErrors.totalMonths = "Months must be between 1 and 120";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const pkgData = {
      name: name.trim(),
      description: description.trim() || undefined,
      totalMonths: totalMonths === "" ? undefined : Number(totalMonths),
    };

    if (isEdit && initialData && onUpdate) {
      onUpdate(initialData.id, pkgData);
    } else {
      onAdd(pkgData);
    }

    // Reset form
    setName("");
    setDescription("");
    setTotalMonths("");
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {isEdit ? "Edit Package" : "Create New Package"}
              </DialogTitle>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {isEdit
                ? "Update the package details below"
                : "Fill in the information to create a new package"}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Package Name Field */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Package Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Enter package name..."
              className={`transition-all duration-200 ${
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "focus:border-blue-500 focus:ring-blue-200"
              }`}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Description
              <span className="text-xs text-gray-500 ml-1">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your package..."
              rows={3}
              className="resize-none transition-all duration-200 focus:border-blue-500 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          {/* Total Months Field */}
          <div className="space-y-2">
            <Label
              htmlFor="totalMonths"
              className="text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Duration (Months)
              <span className="text-xs text-gray-500 ml-1">(optional)</span>
            </Label>
            <Input
              id="totalMonths"
              type="number"
              min="1"
              max="120"
              value={totalMonths}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? "" : Number(e.target.value);
                setTotalMonths(value);
                if (errors.totalMonths) {
                  setErrors((prev) => ({ ...prev, totalMonths: undefined }));
                }
              }}
              placeholder="e.g., 12"
              className={`transition-all duration-200 ${
                errors.totalMonths
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "focus:border-blue-500 focus:ring-blue-200"
              }`}
            />
            {errors.totalMonths && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.totalMonths}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Specify the duration in months (1-120)
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 transition-all duration-200 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm"
          >
            {isEdit ? "Update Package" : "Create Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
