"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StepProps } from "@/types/onboarding"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useSession } from "@/lib/auth-client"

type AMUser = {
  id: string
  name: string | null
  email: string | null
}

export function GeneralInfo({ formData, updateFormData, onNext }: StepProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // ----- AM fetching state -----
  const [ams, setAms] = useState<AMUser[]>([])
  const [amsLoading, setAmsLoading] = useState<boolean>(false)
  const [amsError, setAmsError] = useState<string | null>(null)

  // ----- Session (Better Auth) -----
  const { data: session } = useSession()
  const currentUserId = (session as any)?.user?.id as string | undefined
  const currentUserRole =
    ((session as any)?.user?.role?.name as string | undefined) ??
    ((session as any)?.user?.role as string | undefined)
  const isAM = (currentUserRole ?? "").toLowerCase() === "am"

  useEffect(() => {
    let mounted = true
    const loadAMs = async () => {
      try {
        setAmsLoading(true)
        setAmsError(null)

        // If your API supports role & paging, use them to minimize payloads
        const res = await fetch("/api/users?role=am&limit=100", { cache: "no-store" })
        const json = await res.json()

        // Accept both shapes: {users: [...]} (yours) or {data: [...]}
        const raw = (json?.users ?? json?.data ?? []) as any[]

        const list = raw
          .filter((u) => u?.role?.name === "am") // client-side safety guard
          .map((u) => ({ id: u.id as string, name: u.name as string | null, email: u.email as string | null }))

        if (mounted) setAms(list)
      } catch {
        if (mounted) setAmsError("Failed to load AM list")
      } finally {
        if (mounted) setAmsLoading(false)
      }
    }
    loadAMs()
    return () => {
      mounted = false
    }
  }, [])

  // If the logged-in user is an AM, force-select their ID and keep it locked
  useEffect(() => {
    if (isAM && currentUserId && formData.amId !== currentUserId) {
      updateFormData({ amId: currentUserId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAM, currentUserId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData({ profilePicture: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const amLabel = (u: AMUser) => {
    const n = u.name?.trim()
    const e = u.email?.trim()
    if (n && e) return `${n} (${e})`
    return n || e || u.id
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">General Information</h1>
        <p className="text-gray-500 mt-2">Let's start with some basic information about you or your business.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Enter your full name"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label className="mb-2">Profile Picture</Label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border border-gray-300">
              {previewUrl ? (
                <Image src={previewUrl || "/placeholder.svg"} alt="Profile preview" fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Upload size={16} />
                <span>Upload</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthdate">Birth Date</Label>
            <div className="mt-1">
              <DatePicker
                selected={formData.birthdate ? new Date(formData.birthdate) : null}
                onChange={(date: Date | null) => updateFormData({ birthdate: date ? date.toISOString() : "" })}
                dateFormat="MMMM d, yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                placeholderText="Select birth date"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => updateFormData({ location: e.target.value })}
              placeholder="Enter your location"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company || ""}
              onChange={(e) => updateFormData({ company: e.target.value })}
              placeholder="Enter your company"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              value={formData.designation || ""}
              onChange={(e) => updateFormData({ designation: e.target.value })}
              placeholder="Enter your designation"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyaddress">Company Address</Label>
            <Input
              id="companyaddress"
              value={formData.companyaddress || ""}
              onChange={(e) => updateFormData({ companyaddress: e.target.value })}
              placeholder="Enter company address"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="companywebsite">Company Website</Label>
            <Input
              id="companywebsite"
              value={formData.companywebsite || ""}
              onChange={(e) => updateFormData({ companywebsite: e.target.value })}
              placeholder="https://company.com"
              className="mt-1"
              inputMode="url"
            />
          </div>
        </div>

        {/* ---------- AM selection + Status + Dates ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* AM Select */}
          <div>
            <Label htmlFor="amId">Account Manager (AM)</Label>
            <Select
              value={(isAM && currentUserId) ? currentUserId : (formData.amId || "")}
              onValueChange={(value) => updateFormData({ amId: value === "__none__" ? "" : value })}
              disabled={isAM}
            >
              <SelectTrigger className="mt-1" id="amId" aria-label="Select account manager">
                <SelectValue placeholder={amsLoading ? "Loading AMs..." : (ams.length ? "Select account manager" : "No AMs found")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>Select Account Manager</SelectItem>
                {isAM && currentUserId
                  ? (
                    (() => {
                      const me = ams.find((u) => u.id === currentUserId)
                      return (
                        <SelectItem key={currentUserId} value={currentUserId}>
                          {me ? (me.name ?? me.email ?? currentUserId) : "You"}
                        </SelectItem>
                      )
                    })()
                  )
                  : (
                    ams.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))
                  )}
              </SelectContent>
            </Select>
            {amsError && <p className="text-sm text-red-600 mt-1">{amsError}</p>}
            {isAM && (
              <p className="text-xs text-gray-500 mt-1">As an Account Manager, this field is locked to your account.</p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status || ""} onValueChange={(value) => updateFormData({ status: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startDate" className="mb-1">Start Date</Label>
            <DatePicker
              selected={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(date: Date | null) => updateFormData({ startDate: date ? date.toISOString() : "" })}
              dateFormat="MMMM d, yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              placeholderText="Select start date"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate" className="mb-1">Due Date</Label>
            <DatePicker
              selected={formData.dueDate ? new Date(formData.dueDate) : null}
              onChange={(date: Date | null) => updateFormData({ dueDate: date ? date.toISOString() : "" })}
              dateFormat="MMMM d, yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              placeholderText="Select due date"
              className="w-full border border-gray-300 rounded-md px-4 py-2"
            />
          </div>
        </div>
        
        <h2 className="text-lg font-semibold mb-4 bg-gray-200 p-2 rounded-md">This section is Optional</h2>

        {/* ---------- Email / Phone / Password / Recovery Email ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Client Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => updateFormData({ email: e.target.value })}
              placeholder="client@example.com"
              className="mt-1"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <Label htmlFor="phone">Client Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              placeholder="+1XXXXXXXXX"
              className="mt-1"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password || ""}
              onChange={(e) => updateFormData({ password: e.target.value })}
              placeholder="Set a password"
              className="mt-1"
              autoComplete="new-password"
            />
          </div>

          <div>
            <Label htmlFor="recoveryEmail">Recovery Email</Label>
            <Input
              id="recoveryEmail"
              type="email"
              value={formData.recoveryEmail || ""}
              onChange={(e) => updateFormData({ recoveryEmail: e.target.value })}
              placeholder="recovery@example.com"
              className="mt-1"
              autoComplete="email"
              inputMode="email"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={onNext} disabled={!formData.name}>
          Next
        </Button>
      </div>
    </div>
  )
}
