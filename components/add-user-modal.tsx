"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Shield, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

interface Role {
  id: string
  name: string
  description?: string
}

interface ValidationErrors {
  name?: string
  email?: string
  password?: string
  role?: string
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [roleLoading, setRoleLoading] = useState(false)

  const getPasswordRequirement = (roleName: string): number => {
    switch (roleName.toLowerCase()) {
      case "admin":
        return 12
      case "agent":
        return 10
      case "manager":
        return 11
      default:
        return 8
    }
  }

  const selectedRoleData = roles.find((role) => role.id === selectedRole)
  const requiredPasswordLength = selectedRoleData ? getPasswordRequirement(selectedRoleData.name) : 8

  // 🚀 Fetch roles from API when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  const fetchRoles = async () => {
    try {
      setRoleLoading(true)
      const res = await fetch("/api/roles")
      const json = await res.json()
      if (json.success && json.data) {
        setRoles(Array.isArray(json.data) ? json.data : [])
      } else {
        throw new Error(json.error || "Failed to fetch roles")
      }
    } catch (err: any) {
      console.error("Error fetching roles:", err)
      setRoles([]) // Ensure roles is always an array
      toast.error("Failed to load roles", {
        description: err.message || "Unexpected error",
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setRoleLoading(false)
    }
  }

  const validateForm = (formData: FormData): boolean => {
    const errors: ValidationErrors = {}
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    if (!name?.trim()) errors.name = "Name is required"
    if (!email) errors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email"
    if (!role) errors.role = "Role is required"
    if (!password) errors.password = "Password is required"
    else if (role) {
      const roleData = roles.find((r) => r.id === role)
      if (roleData) {
        const requiredLength = getPasswordRequirement(roleData.name)
        if (password.length < requiredLength) {
          errors.password = `At least ${requiredLength} characters for ${roleData.name} role`
        }
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    if (!validateForm(formData)) {
      toast.error("Please fix the validation errors", {
        description: "Check the form fields and try again",
        icon: <AlertCircle className="h-4 w-4" />,
      })
      return
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const roleId = formData.get("role") as string

    const selectedRoleData = roles.find((role) => role.id === roleId)

    try {
      setLoading(true)

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          address,
          roleId,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Unknown error occurred")
      }

      toast.success("User created successfully!", {
        description: `${name} has been added as ${selectedRoleData?.name}`,
        icon: <CheckCircle className="h-4 w-4" />,
      })

      form.reset()
      setSelectedRole("")
      setValidationErrors({})
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Failed to create user", {
        description: error.message || "Unexpected error",
        icon: <XCircle className="h-4 w-4" />,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string) => {
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setSelectedRole("")
      setValidationErrors({})
      setShowPassword(false)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Add New User
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  {/* Name Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className={validationErrors.name ? "border-red-500" : ""}
                      onChange={() => handleInputChange("name")}
                      required
                    />
                    {validationErrors.name && <ErrorText text={validationErrors.name} />}
                  </div>

                  {/* Email Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className={validationErrors.email ? "border-red-500" : ""}
                      onChange={() => handleInputChange("email")}
                      required
                    />
                    {validationErrors.email && <ErrorText text={validationErrors.email} />}
                  </div>

                  {/* Role Selector */}
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      name="role"
                      value={selectedRole}
                      onValueChange={(value) => {
                        setSelectedRole(value)
                        handleInputChange("role")
                      }}
                      disabled={roleLoading}
                    >
                      <SelectTrigger className={validationErrors.role ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles && roles.length > 0 ? (
                          roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}{" "}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({getPasswordRequirement(role.name)} chars min)
                              </span>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="no-roles">
                            {roleLoading ? "Loading roles..." : "No roles available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.role && <ErrorText text={validationErrors.role} />}
                    {selectedRoleData && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        {selectedRoleData.name} requires {requiredPasswordLength}+ character password
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={`Min ${requiredPasswordLength} characters`}
                        className={validationErrors.password ? "border-red-500" : ""}
                        onChange={() => handleInputChange("password")}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {validationErrors.password && <ErrorText text={validationErrors.password} />}
                  </div>

                  {/* Phone */}
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>

                  {/* Address */}
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input id="address" name="address" type="text" />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 🔻 Reusable error component
function ErrorText({ text }: { text: string }) {
  return (
    <p className="text-sm text-red-500 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {text}
    </p>
  )
}
