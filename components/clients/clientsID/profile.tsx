// ////components/clients/clientsID/profile.tsx
"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  Building,
  Globe,
  Package,
  Clock,
  User,
  Briefcase,
  ExternalLink,
  Share2,
  AtSign,
  BadgeCheck,
  Mail,
  Phone as PhoneIcon,
  Lock,
  Eye,
  EyeOff,
  PencilLine,
  Pencil,
  Check,
  X,
  Loader2,
  Plus,
  UserCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Client } from "@/types/client"
import { toast } from "sonner"

type ClientWithSocial = Client & {
  // new optional fields (present in your Prisma model & API)
  email?: string | null
  phone?: string | null
  password?: string | null
  recoveryEmail?: string | null
  amId?: string | null
  accountManager?: {
    id: string
    name?: string | null
    email?: string | null
    role?: { name?: string | null } | null
  } | null

  socialMedias?: Array<{
    id?: string
    platform?: string
    url?: string | null
    username?: string | null
    email?: string | null
    phone?: string | null
    password?: string | null
    notes?: string | null
  }>
}

interface ProfileProps {
  clientData: ClientWithSocial
}

type FormValues = {
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

export function Profile({ clientData }: ProfileProps) {
  const router = useRouter()

  // --- password reveal (display mode) for social rows
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  const mask = (value?: string | null, visible?: boolean) => {
    if (!value) return "—"
    const plain = value.trim()
    if (/gmail\s*login/i.test(plain)) return plain
    if (visible) return plain
    return "•".repeat(Math.min(plain.length, 10))
  }

  // --- client main password reveal
  const [showClientPassword, setShowClientPassword] = useState(false)

  // --- inline Social row edit state
  type SocialDraft = {
    platform?: string | null
    url?: string | null
    username?: string | null
    email?: string | null
    phone?: string | null
    password?: string | null
    notes?: string | null
  }
  const [editingRow, setEditingRow] = useState<Record<string, boolean>>({})
  const [rowDrafts, setRowDrafts] = useState<Record<string, SocialDraft>>({})
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({})

  // --- add-row state
  const [addingRow, setAddingRow] = useState(false)
  const [addDraft, setAddDraft] = useState<SocialDraft>({
    platform: "",
    url: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    notes: "",
  })
  const [addSaving, setAddSaving] = useState(false)

  const nullIfEmpty = (v?: string | null) => {
    if (v === undefined || v === null) return undefined // leave untouched
    const t = String(v).trim()
    return t === "" ? null : t
  }

  const startEditRow = (id: string, sm: NonNullable<ClientWithSocial["socialMedias"]>[number]) => {
    setEditingRow((p) => ({ ...p, [id]: true }))
    setRowDrafts((p) => ({
      ...p,
      [id]: {
        platform: sm.platform ?? "",
        url: sm.url ?? "",
        username: sm.username ?? "",
        email: sm.email ?? "",
        phone: sm.phone ?? "",
        password: sm.password ?? "",
        notes: sm.notes ?? "",
      },
    }))
  }

  const cancelEditRow = (id: string) => {
    setEditingRow((p) => ({ ...p, [id]: false }))
    setRowDrafts((p) => {
      const { [id]: _omit, ...rest } = p
      return rest
    })
  }

  const changeDraft = (id: string, key: keyof SocialDraft, value: string) => {
    setRowDrafts((p) => ({
      ...p,
      [id]: {
        ...(p[id] || {}),
        [key]: value,
      },
    }))
  }

  const saveRow = async (id: string) => {
    try {
      setRowSaving((p) => ({ ...p, [id]: true }))
      const draft = rowDrafts[id] || {}

      const payload = {
        platform: nullIfEmpty(draft.platform ?? undefined),
        url: nullIfEmpty(draft.url ?? undefined),
        username: nullIfEmpty(draft.username ?? undefined),
        email: nullIfEmpty(draft.email ?? undefined),
        phone: nullIfEmpty(draft.phone ?? undefined),
        password: nullIfEmpty(draft.password ?? undefined),
        notes: nullIfEmpty(draft.notes ?? undefined),
      }

      const res = await fetch(`/api/social-medias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Failed with ${res.status}`)
      }

      toast.success("Social media updated")
      setEditingRow((p) => ({ ...p, [id]: false }))
      setRowDrafts((p) => {
        const { [id]: _omit, ...rest } = p
        return rest
      })
      router.refresh()
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to update social media")
    } finally {
      setRowSaving((p) => ({ ...p, [id]: false }))
    }
  }

  // --- create social row
  const createRow = async () => {
    try {
      setAddSaving(true)
      const payload = {
        clientId: clientData.id,
        platform: nullIfEmpty(addDraft.platform),
        url: nullIfEmpty(addDraft.url),
        username: nullIfEmpty(addDraft.username),
        email: nullIfEmpty(addDraft.email),
        phone: nullIfEmpty(addDraft.phone),
        password: nullIfEmpty(addDraft.password),
        notes: nullIfEmpty(addDraft.notes),
      }

      const res = await fetch(`/api/social-medias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Failed with ${res.status}`)
      }

      toast.success("Social media added")
      setAddingRow(false)
      setAddDraft({ platform: "", url: "", username: "", email: "", phone: "", password: "", notes: "" })
      router.refresh()
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to add social media")
    } finally {
      setAddSaving(false)
    }
  }

  // --- edit dialog (client profile) state
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Packages for selector (name display, id submit)
  type PackageOption = { id: string; name: string }
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)

  // AMs for selector
  const [ams, setAms] = useState<AMUser[]>([])
  const [amsLoading, setAmsLoading] = useState(false)
  const [amsError, setAmsError] = useState<string | null>(null)

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true)
      const res = await fetch("/api/packages", { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load packages: ${res.status}`)
      const data = await res.json().catch(() => [])
      // Accept either {packages:[...]} or array directly
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

  // Load packages & AMs when dialog opens
  useEffect(() => {
    if (open) {
      fetchPackages()
      fetchAMs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toDateInput = (v?: string | null) => {
    if (!v) return ""
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return ""
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatPlatformLabel = (value?: string) =>
    (value || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())

  const statusBadgeClass = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "paused":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "inactive":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    }
  }

  const websites: string[] = useMemo(
    () =>
      [
        clientData.website ?? "",
        clientData.website2 ?? "",
        clientData.website3 ?? "",
        clientData.companywebsite?.startsWith("http")
          ? clientData.companywebsite
          : clientData.companywebsite
            ? `https://${clientData.companywebsite}`
            : "",
      ].filter((url) => url && url.trim() !== ""),
    [
      clientData.website,
      clientData.website2,
      clientData.website3,
      clientData.companywebsite,
    ]
  )

  // Task-derived progress (same formula as in Tasks component)
  const normalizeStatus = (raw?: string | null) => {
    const s = (raw ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\-\s]+/g, "_")
    if (["done", "complete", "completed", "finished", "qc_approved", "approved"].includes(s)) return "completed"
    if (["in_progress", "in-progress", "progress", "doing", "working"].includes(s)) return "in_progress"
    if (["overdue", "late"].includes(s)) return "overdue"
    if (["pending", "todo", "not_started", "on_hold", "paused", "backlog"].includes(s)) return "pending"
    return s || "pending"
  }

  const totalTasks = clientData.tasks?.length || 0
  const completedTasks = clientData.tasks?.filter((t: any) => normalizeStatus(t?.status) === "completed").length || 0
  const inProgressTasks = clientData.tasks?.filter((t: any) => normalizeStatus(t?.status) === "in_progress").length || 0
  const pendingTasks = clientData.tasks?.filter((t: any) => normalizeStatus(t?.status) === "pending").length || 0
  const overdueTasks = clientData.tasks?.filter((t: any) => normalizeStatus(t?.status) === "overdue").length || 0
  const derivedProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  // --- Client edit dialog (existing fields + NEW)
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

  const onOpenEdit = () => {
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
    setOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true)
      const payload: FormValues = {
        ...values,
        progress:
          values.progress === undefined || values.progress === null
            ? undefined
            : Number(values.progress),
        birthdate: values.birthdate || undefined,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        amId: values.amId && values.amId.trim() !== "" ? values.amId : null,
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
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to update client")
    } finally {
      setIsSaving(false)
    }
  }

  const hasSocial = !!clientData.socialMedias?.length

  const amDisplay = clientData.accountManager
    ? (clientData.accountManager.name || clientData.accountManager.email || clientData.accountManager.id)
    : "Unassigned"

  return (
    <>
      {/* Top toolbar */}
      <div className="flex items-center justify-end mb-4">
        <Button
          variant="outline"
          onClick={onOpenEdit}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white hover:text-white"
        >
          <PencilLine className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</label>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{clientData.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</label>
                <div className="mt-1">
                  <Badge className={statusBadgeClass(clientData.status ?? undefined)}>
                    {(clientData.status ?? "inactive").replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Birth Date</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">
                    {clientData.birthdate ? formatDate(clientData.birthdate as any) : "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Location</label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">{clientData.location ?? ""}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Progress</label>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Completion</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {derivedProgress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${derivedProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Manager & Contact */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20">
            <CardTitle className="flex items-center space-x-2">
              <UserCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Account Manager & Contact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Account Manager</label>
                <div className="flex items-center mt-1">
                  <BadgeCheck className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">{amDisplay}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">{clientData.email ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Phone</label>
                <div className="flex items-center mt-1">
                  <PhoneIcon className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">{clientData.phone ?? "—"}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Recovery Email</label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">{clientData.recoveryEmail ?? "—"}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Password</label>
              <div className="flex items-center gap-2 mt-1">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="font-mono">{mask(clientData.password, showClientPassword)}</span>
                {!!clientData.password && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setShowClientPassword((s) => !s)}
                    title={showClientPassword ? "Hide password" : "Show password"}
                  >
                    {showClientPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-blue-500/20">
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              <span>Professional Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Company</label>
                <div className="flex items-center mt-1">
                  <Building className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">{clientData.company ?? ""}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Designation</label>
                <p className="text-slate-900 dark:text-slate-100 mt-1">{clientData.designation ?? ""}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Company Address</label>
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                <span className="text-slate-900 dark:text-slate-100">{clientData.companyaddress ?? ""}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Websites</label>
              <div className="mt-2 space-y-2">
                {websites.length > 0 ? (
                  websites.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:underline break-all"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        <span className="mr-1">{url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">No websites configured</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Information */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <span>Package Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Package Name</label>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {clientData.package?.name ?? ""}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Template</label>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {clientData.assignments?.[0]?.template?.name ?? ""}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Start Date</label>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">
                    {clientData.startDate ? formatDate(clientData.startDate as any) : "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Due Date</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-slate-900 dark:text-slate-100">
                    {clientData.dueDate ? formatDate(clientData.dueDate as any) : "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Package ID</label>
                <p className="text-slate-900 dark:text-slate-100 mt-1 font-mono text-sm">
                  {(clientData.packageId as string) ?? ""}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</label>
              <p className="text-slate-700 dark:text-slate-300 mt-1">{clientData.package?.description ?? ""}</p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media (inline editable + add) */}
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-rose-600" />
                <span>Social Media</span>
                <Badge variant="secondary">{clientData.socialMedias?.length ?? 0}</Badge>
              </CardTitle>

              <Button
                variant="default"
                className="gap-2 bg-gradient-to-r from-pink-600 to-pink-800 hover:from-pink-700 hover:to-pink-900 dark:from-pink-600 dark:to-pink-900"
                onClick={() => setAddingRow(true)}
                title="Add Social"
              >
                <Plus className="h-4 w-4" />
                Add Social
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {(!hasSocial && !addingRow) ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No social media configured
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-rose-50 dark:bg-rose-900/20 text-left text-slate-700 dark:text-slate-200">
                      <th className="px-4 py-3 font-semibold">PLATFORM</th>
                      <th className="px-4 py-3 font-semibold">LINK</th>
                      <th className="px-4 py-3 font-semibold">USERNAME</th>
                      <th className="px-4 py-3 font-semibold">EMAIL</th>
                      <th className="px-4 py-3 font-semibold">PHONE</th>
                      <th className="px-4 py-3 font-semibold">PASSWORD</th>
                      <th className="px-4 py-3 font-semibold">NOTES</th>
                      <th className="px-4 py-3 font-semibold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add row */}
                    {addingRow && (
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-rose-50/50 dark:bg-rose-900/10">
                        <td className="px-4 py-3">
                          <Input
                            value={addDraft.platform ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, platform: e.target.value }))}
                            placeholder="Platform (e.g., Facebook)"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={addDraft.url ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, url: e.target.value }))}
                            placeholder="https://"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={addDraft.username ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, username: e.target.value }))}
                            placeholder="@username"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="email"
                            value={addDraft.email ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, email: e.target.value }))}
                            placeholder="email@example.com"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={addDraft.phone ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="+8801..."
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={addDraft.password ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, password: e.target.value }))}
                            placeholder="(optional)"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={addDraft.notes ?? ""}
                            onChange={(e) => setAddDraft((p) => ({ ...p, notes: e.target.value }))}
                            placeholder="Notes"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAddingRow(false)
                                setAddDraft({ platform: "", url: "", username: "", email: "", phone: "", password: "", notes: "" })
                              }}
                              className="h-8 px-2"
                              title="Cancel"
                              disabled={addSaving}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={createRow}
                              className="h-8 px-2"
                              title="Save"
                              disabled={addSaving}
                            >
                              {addSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Existing rows */}
                    {hasSocial &&
                      [...clientData.socialMedias!]
                        .sort((a, b) => {
                          const ap = (a.platform ?? "").toLowerCase()
                          const bp = (b.platform ?? "").toLowerCase()
                          return ap.localeCompare(bp)
                        })
                        .map((sm, idx) => {
                          const id = sm.id || `row-${idx}`
                          const link = (sm.url?.trim() ?? "")
                          const show = !!showPasswords[id]
                          const revealable = !!sm.password && !/gmail\s*login/i.test(sm.password ?? "")
                          const isEditing = !!editingRow[id]
                          const draft = rowDrafts[id] || {}

                          return (
                            <tr
                              key={id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                            >
                              {/* PLATFORM */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  <span className="text-slate-900 dark:text-slate-100">
                                    {formatPlatformLabel(String(sm.platform))}
                                  </span>
                                ) : (
                                  <Input
                                    value={draft.platform ?? ""}
                                    onChange={(e) => changeDraft(id, "platform", e.target.value)}
                                    placeholder="Platform (e.g., Facebook)"
                                  />
                                )}
                              </td>

                              {/* LINK */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  link ? (
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                                    >
                                      {link}
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )
                                ) : (
                                  <Input
                                    value={draft.url ?? ""}
                                    onChange={(e) => changeDraft(id, "url", e.target.value)}
                                    placeholder="https://"
                                  />
                                )}
                              </td>

                              {/* USERNAME */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  <span className="font-mono">{sm.username ?? "—"}</span>
                                ) : (
                                  <Input
                                    value={draft.username ?? ""}
                                    onChange={(e) => changeDraft(id, "username", e.target.value)}
                                    placeholder="@username"
                                  />
                                )}
                              </td>

                              {/* EMAIL */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  <span className="font-mono">{sm.email ?? "—"}</span>
                                ) : (
                                  <Input
                                    type="email"
                                    value={draft.email ?? ""}
                                    onChange={(e) => changeDraft(id, "email", e.target.value)}
                                    placeholder="email@example.com"
                                  />
                                )}
                              </td>

                              {/* PHONE */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  <span className="font-mono">{sm.phone ?? "—"}</span>
                                ) : (
                                  <Input
                                    value={draft.phone ?? ""}
                                    onChange={(e) => changeDraft(id, "phone", e.target.value)}
                                    placeholder="+8801..."
                                  />
                                )}
                              </td>

                              {/* PASSWORD */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">{mask(sm.password, show)}</span>
                                    {revealable ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() => togglePasswordVisibility(id)}
                                        title={show ? "Hide password" : "Show password"}
                                      >
                                        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      </Button>
                                    ) : sm.password ? (
                                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                                    ) : null}
                                  </div>
                                ) : (
                                  <Input
                                    value={draft.password ?? ""}
                                    onChange={(e) => changeDraft(id, "password", e.target.value)}
                                    placeholder="(optional)"
                                  />
                                )}
                              </td>

                              {/* NOTES */}
                              <td className="px-4 py-3">
                                {!isEditing ? (
                                  <span className="text-slate-600 dark:text-slate-300 italic">
                                    {sm.notes ?? "—"}
                                  </span>
                                ) : (
                                  <Input
                                    value={draft.notes ?? ""}
                                    onChange={(e) => changeDraft(id, "notes", e.target.value)}
                                    placeholder="Notes"
                                  />
                                )}
                              </td>

                              {/* ACTIONS */}
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  {!isEditing ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditRow(id, sm)}
                                      className="h-8 px-2"
                                      title="Edit row"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => cancelEditRow(id)}
                                        className="h-8 px-2"
                                        title="Cancel"
                                        disabled={rowSaving[id]}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => saveRow(id)}
                                        className="h-8 px-2"
                                        title="Save"
                                        disabled={rowSaving[id]}
                                      >
                                        {rowSaving[id] ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog (client profile) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
          </DialogHeader>

          <form id="edit-client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic */}
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

            {/* Contact & Credentials */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Contact & Credentials</h3>
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
                <div>
                  <Label htmlFor="imageDrivelink" className="pb-2">Image Drive Link</Label>
                  <Input id="imageDrivelink" className="border-2 border-gray-400" {...register("imageDrivelink")} />
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
          </form>

          <DialogFooter>
            <Button variant="ghost" className="bg-green-600 hover:bg-green-700 hover:text-white text-white" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="edit-client-form" type="submit" className="bg-blue-600 hover:bg-blue-700 hover:text-white text-white" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
