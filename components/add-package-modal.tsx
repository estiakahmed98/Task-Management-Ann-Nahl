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

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newPackage: { name: string; description?: string }) => void;
  isEdit?: boolean;
  initialData?: {
    id: string;
    name: string;
    description?: string;
  };
  onUpdate?: (
    id: string,
    updatedPackage: { name: string; description?: string }
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

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [isOpen, isEdit, initialData]);

  const handleSubmit = () => {
    const pkgData = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    if (!pkgData.name) {
      alert("Package name is required.");
      return;
    }

    if (isEdit && initialData && onUpdate) {
      onUpdate(initialData.id, pkgData);
    } else {
      onAdd(pkgData);
    }

    // Reset
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Package" : "Create New Package"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {isEdit ? "Update Package" : "Create Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
