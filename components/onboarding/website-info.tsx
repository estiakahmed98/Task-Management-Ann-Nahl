"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { StepProps } from "@/types/onboarding"

export function WebsiteInfo({ formData, updateFormData, onNext, onPrevious }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Website Information</h1>
        <p className="text-gray-500 mt-2">Please provide your website URLs if you have any.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="website">Primary Website</Label>
          <Input
            id="website"
            value={formData.website || ""}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://example.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="website2">Secondary Website</Label>
          <Input
            id="website2"
            value={formData.website2 || ""}
            onChange={(e) => updateFormData({ website2: e.target.value })}
            placeholder="https://example2.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="website3">Third Website</Label>
          <Input
            id="website3"
            value={formData.website3 || ""}
            onChange={(e) => updateFormData({ website3: e.target.value })}
            placeholder="https://example3.com"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}
