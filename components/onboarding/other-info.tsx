"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StepProps } from "@/types/onboarding"

export function OtherInfo({ formData, updateFormData, onNext, onPrevious }: StepProps) {
  type KV = { title: string; data: string }
  const [rows, setRows] = useState<KV[]>(() => {
    const raw = formData.otherField
    if (!raw) return []
    return raw.map((r) => ({ title: r.title ?? "", data: r.data ?? "" }))
  })

  useEffect(() => {
    setRows((formData.otherField || []).map((r) => ({ title: r.title ?? "", data: r.data ?? "" })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNext = () => {
    const cleaned = rows
      .map((r) => ({ title: r.title.trim(), data: r.data.trim() }))
      .filter((r) => r.title || r.data)
    updateFormData({ otherField: cleaned })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Other Information</h2>
        <p className="text-sm text-muted-foreground">Add any number of custom title/data pairs. These will be saved in the client's Other Field (JSON).</p>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
            <div className="md:col-span-2">
              <Label className="pb-1">Title</Label>
              <Input
                value={row.title}
                onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)))}
                className="border-2 border-gray-300"
              />
            </div>
            <div className="md:col-span-3">
              <Label className="pb-1">Data</Label>
              <Input
                value={row.data}
                onChange={(e) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, data: e.target.value } : r)))}
                className="border-2 border-gray-300"
              />
            </div>
            <div className="flex md:justify-end">
              <Button type="button" variant="ghost" className="text-red-600" onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, { title: "", data: "" }])}>+ Add Row</Button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>Previous</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
