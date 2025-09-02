"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ReassignNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: string;
}

export default function ReassignNoteModal({ 
  isOpen, 
  onClose, 
  note 
}: ReassignNoteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Reassignment Note
          </DialogTitle>
          <DialogDescription>
            Details about why this task was reassigned
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {note || "No reassignment note provided."}
          </p>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}