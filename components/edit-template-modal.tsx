"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit3, Loader2, Save } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Template;
  onUpdated: () => void;
}

export function EditTemplateModal({
  isOpen,
  onClose,
  initialData,
  onUpdated,
}: EditTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Update form values when initialData changes
  useEffect(() => {
    setName(initialData.name || "");
    setDescription(initialData.description || "");
    setStatus(initialData.status || "draft");
  }, [initialData]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Template name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${initialData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          packageId: (initialData as any).packageId || null, // 🔧 safely send it
          sitesAssets: [], // 🛡️ this avoids backend mistakenly deleting assets
        }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const error = await res.json();
        alert(error.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Edit3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Edit Template
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Update the template information below.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label
              htmlFor="edit-name"
              className="text-sm font-medium text-gray-700"
            >
              Template Name *
            </Label>
            <Input
              id="edit-name"
              placeholder="Enter template name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </Label>
            <Textarea
              id="edit-description"
              placeholder="Describe what this template does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px]"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit-status"
              className="text-sm font-medium text-gray-700"
            >
              Status
            </Label>
            <Select value={status} onValueChange={setStatus} disabled={loading}>
              <SelectTrigger className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="px-6 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
