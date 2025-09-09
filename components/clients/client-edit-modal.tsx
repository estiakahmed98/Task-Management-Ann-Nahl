// components/clients/client-edit-modal.tsx
"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useUserSession } from "@/lib/hooks/use-user-session"

import type { Client } from "@/types/client"

type ClientWithSocial = Client & {
  email?: string | null
  phone?: string | null
  password?: string | null
  recoveryEmail?: string | null
  amId?: string | null
}

export type FormValues = {
  name: string
  birthdate?: string
  company?: string
  designation?: string
  location?: string

  // contact/credentials
  email?: string | null
  phone?: string | null
  password?: string | null
  recoveryEmail?: string | null

  // websites & media
  website?: string
  website2?: string
  website3?: string
  companywebsite?: string
  companyaddress?: string
  biography?: string
  imageDrivelink?: string
  avatar?: string

  progress?: number
  status?: string
  packageId?: string
  startDate?: string
  dueDate?: string

  // AM
  amId?: string | null
}

type AMUser = { id: string; name: string | null; email: string | null }
type PackageOption = { id: string; name: string }

export interface ClientEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientData: ClientWithSocial
  currentUserRole?: string
  /** Called after a successful save */
  onSaved?: () => void
}

function toDateInput(v?: string | null) {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function ClientEditModal({
  open,
  onOpenChange,
  clientData,
  currentUserRole,
  onSaved,
}: ClientEditModalProps) {
  const router = useRouter()
  const { user } = useUserSession()

  const roleName =
    (currentUserRole ?? (user as any)?.role?.name ?? (user as any)?.role ?? "").toString().toLowerCase()
  const isAgent = roleName === "agent"

  // loading & options
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)

  const [ams, setAms] = useState<AMUser[]>([])
  const [amsLoading, setAmsLoading] = useState(false)
  const [amsError, setAmsError] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: clientData.name ?? "",
      birthdate: toDateInput(clientData.birthdate as any),
      company: clientData.company ?? "",
      designation: clientData.designation ?? "",
      location: clientData.location ?? "",
      email: clientData.email ?? "",
      phone: clientData.phone ?? "",
      password: clientData.password ?? "",
      recoveryEmail: clientData.recoveryEmail ?? "",
      website: clientData.website ?? "",
      website2: clientData.website2 ?? "",
      website3: clientData.website3 ?? "",
      companywebsite: clientData.companywebsite ?? "",
      companyaddress: clientData.companyaddress ?? "",
      biography: (clientData as any).biography ?? "",
      imageDrivelink: (clientData as any).imageDrivelink ?? "",
      avatar: (clientData as any).avatar ?? "",
      progress: clientData.progress ?? 0,
      status: (clientData.status as string) ?? "inactive",
      packageId: (clientData.packageId as string) ?? "",
      startDate: toDateInput(clientData.startDate as any),
      dueDate: toDateInput(clientData.dueDate as any),
      amId: clientData.amId ?? null,
    },
  })

  // rehydrate form whenever the modal is opened (so stale edits don't linger)
  useEffect(() => {
    if (!open) return
    reset({
      name: clientData.name ?? "",
      birthdate: toDateInput(clientData.birthdate as any),
      company: clientData.company ?? "",
      designation: clientData.designation ?? "",
      location: clientData.location ?? "",
      email: clientData.email ?? "",
      phone: clientData.phone ?? "",
      password: clientData.password ?? "",
      recoveryEmail: clientData.recoveryEmail ?? "",
      website: clientData.website ?? "",
      website2: clientData.website2 ?? "",
      website3: clientData.website3 ?? "",
      companywebsite: clientData.companywebsite ?? "",
      companyaddress: clientData.companyaddress ?? "",
      biography: (clientData as any).biography ?? "",
      imageDrivelink: (clientData as any).imageDrivelink ?? "",
      avatar: (clientData as any).avatar ?? "",
      progress: clientData.progress ?? 0,
      status: (clientData.status as string) ?? "inactive",
      packageId: (clientData.packageId as string) ?? "",
      startDate: toDateInput(clientData.startDate as any),
      dueDate: toDateInput(clientData.dueDate as any),
      amId: clientData.amId ?? null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true)
      const res = await fetch("/api/packages", { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load packages: ${res.status}`)
      const data = await res.json().catch(() => [])
      const list = Array.isArray(data) ? data : Array.isArray(data?.packages) ? data.packages : []
      const options: PackageOption[] = list
        .map((p: any) => ({ id: String(p.id ?? ""), name: String(p.name ?? "Unnamed") }))
        .filter((p: PackageOption) => p.id)
      setPackages(options)
    } catch (e) {
      console.error(e)
      setPackages([])
    } finally {
      setPackagesLoading(false)
    }
  }

  const fetchAMs = async () => {
    try {
      setAmsLoading(true)
      setAmsError(null)
      const res = await fetch("/api/users?role=am&limit=100", { cache: "no-store" })
      const json = await res.json()
      const raw = (json?.users ?? json?.data ?? []) as any[]
      const list = raw
        .filter((u) => u?.role?.name === "am")
        .map((u) => ({ id: String(u.id), name: u.name ?? null, email: u.email ?? null }))
      setAms(list)
    } catch (e) {
      console.error(e)
      setAms([])
      setAmsError("Failed to load AMs")
    } finally {
      setAmsLoading(false)
    }
  }

  // Load packages & AMs when the modal opens (non-agents only, per your original logic)
  useEffect(() => {
    if (open && !isAgent) {
      fetchPackages()
      fetchAMs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAgent])

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true)

      let payload: Partial<FormValues>

      if (isAgent) {
        const allowed: (keyof FormValues)[] = ["email", "phone", "password", "recoveryEmail", "imageDrivelink"]
        payload = allowed.reduce((acc, key) => {
          const val = (values as any)[key]
          if (val !== undefined) (acc as any)[key] = val
          return acc
        }, {} as Partial<FormValues>)
      } else {
        const { email, phone, password, recoveryEmail, imageDrivelink, ...rest } = values
        payload = {
          ...rest,
          progress:
            values.progress === undefined || values.progress === null ? undefined : Number(values.progress),
          birthdate: values.birthdate || undefined,
          startDate: values.startDate || undefined,
          dueDate: values.dueDate || undefined,
          amId: values.amId && values.amId.trim() !== "" ? values.amId : null,
        }
      }

      const res = await fetch(`/api/clients/${clientData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Failed with ${res.status}`)
      }

      toast.success("Client updated")
      onOpenChange(false)
      onSaved?.()
      router.refresh()
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to update client")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
        <DialogHeader>
          <DialogTitle>Edit Client Profile</DialogTitle>
        </DialogHeader>

        <form id="edit-client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isAgent ? (
            <>
              {/* AGENT-ONLY: Contact & Credentials */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  Contact & Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="pb-2">Email</Label>
                    <Input id="email" type="email" className="border-2 border-gray-400" {...register("email")} />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="pb-2">Phone</Label>
                    <Input id="phone" className="border-2 border-gray-400" {...register("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="password" className="pb-2">Password</Label>
                    <Input id="password" type="text" className="border-2 border-gray-400" {...register("password")} />
                  </div>
                  <div>
                    <Label htmlFor="recoveryEmail" className="pb-2">Recovery Email</Label>
                    <Input id="recoveryEmail" type="email" className="border-2 border-gray-400" {...register("recoveryEmail")} />
                  </div>
                </div>
              </section>

              {/* AGENT-ONLY: Media (Image Drive Link only) */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="imageDrivelink" className="pb-2">Image Drive Link</Label>
                    <Input id="imageDrivelink" className="border-2 border-gray-400" {...register("imageDrivelink")} />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* FULL FORM for non-agents — Basic */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Basic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="pb-2">Full Name</Label>
                    <Input id="name" className="border-2 border-gray-400" {...register("name", { required: true })} />
                  </div>
                  <div>
                    <Label htmlFor="status" className="pb-2">Status</Label>
                    <select
                      id="status"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      {...register("status")}
                    >
                      <option value="active">active</option>
                      <option value="in_progress">in_progress</option>
                      <option value="pending">pending</option>
                      <option value="paused">paused</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="birthdate" className="pb-2">Birth Date</Label>
                    <Input id="birthdate" className="border-2 border-gray-400" type="date" {...register("birthdate")} />
                  </div>
                  <div>
                    <Label htmlFor="location" className="pb-2">Location</Label>
                    <Input id="location" className="border-2 border-gray-400" {...register("location")} />
                  </div>
                </div>
              </section>

              {/* Professional */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Professional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company" className="pb-2">Company</Label>
                    <Input id="company" className="border-2 border-gray-400" {...register("company")} />
                  </div>
                  <div>
                    <Label htmlFor="designation" className="pb-2">Designation</Label>
                    <Input id="designation" className="border-2 border-gray-400" {...register("designation")} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="companyaddress" className="pb-2">Company Address</Label>
                    <Input id="companyaddress" className="border-2 border-gray-400" {...register("companyaddress")} />
                  </div>
                </div>
              </section>

              {/* Account Manager */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Account Manager</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="amId" className="pb-2">Assign AM</Label>
                    <select
                      id="amId"
                      className="w-full h-9 rounded-md border border-gray-400 bg-background px-3 text-sm"
                      disabled={amsLoading}
                      {...register("amId")}
                    >
                      <option value="">{amsLoading ? "Loading AMs..." : "— None —"}</option>
                      {ams.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    {amsError && <p className="text-sm text-red-600 mt-1">{amsError}</p>}
                  </div>
                </div>
              </section>

              {/* Websites */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Websites</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website" className="pb-2">Website</Label>
                    <Input id="website" className="border-2 border-gray-400" {...register("website")} />
                  </div>
                  <div>
                    <Label htmlFor="website2" className="pb-2">Website 2</Label>
                    <Input id="website2" className="border-2 border-gray-400" {...register("website2")} />
                  </div>
                  <div>
                    <Label htmlFor="website3" className="pb-2">Website 3</Label>
                    <Input id="website3" className="border-2 border-gray-400" {...register("website3")} />
                  </div>
                  <div>
                    <Label htmlFor="companywebsite" className="pb-2">Company Website</Label>
                    <Input id="companywebsite" className="border-2 border-gray-400" {...register("companywebsite")} />
                  </div>
                </div>
              </section>

              {/* Media / Bio */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Media & Bio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="avatar" className="pb-2">Avatar URL</Label>
                    <Input id="avatar" className="border-2 border-gray-400" {...register("avatar")} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="biography" className="pb-2">Biography</Label>
                    <Textarea id="biography" rows={4} className="border-2 border-gray-400" {...register("biography")} />
                  </div>
                </div>
              </section>

              {/* Package & Dates */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Package & Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="packageId" className="pb-2">Package</Label>
                    <select
                      id="packageId"
                      className="w-full h-9 rounded-md border border-gray-400 bg-background px-3 text-sm"
                      disabled={packagesLoading}
                      {...register("packageId")}
                    >
                      <option value="">{packagesLoading ? "Loading packages..." : "Select a package"}</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="startDate" className="pb-2">Start Date</Label>
                    <Input id="startDate" type="date" className="border-2 border-gray-400" {...register("startDate")} />
                  </div>
                  <div>
                    <Label htmlFor="dueDate" className="pb-2">Due Date</Label>
                    <Input id="dueDate" type="date" className="border-2 border-gray-400" {...register("dueDate")} />
                  </div>
                </div>
              </section>
            </>
          )}
        </form>

        <DialogFooter>
          <Button
            variant="ghost"
            className="bg-green-600 hover:bg-green-700 hover:text-white text-white"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            form="edit-client-form"
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
