"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, GroupIcon as TeamIcon, CheckCircle, Sparkles, Users, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUserSession } from "@/lib/hooks/use-user-session"

export default function CreateTeamPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { user, loading: sessionLoading } = useUserSession()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Team name is required"
    if (formData.name.trim().length < 2) newErrors.name = "Team name must be at least 2 characters"
    if (formData.name.trim().length > 50) newErrors.name = "Team name must be less than 50 characters"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      console.log("Submitting team data:", formData) // Debug log

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", response.status) // Debug log

      const result = await response.json()
      console.log("Response data:", result) // Debug log

      if (!response.ok) {
        throw new Error(result.message || "Failed to create team")
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
      setShowSuccess(true)
      toast.success("Team created successfully!", {
        description: `${formData.name} has been created and is ready for members.`,
      })

      setTimeout(() => {
        router.push("/admin/teams")
      }, 2000)
    } catch (error) {
      console.error("Failed to create team:", error)
      toast.error(`Error: ${(error as Error).message}`, {
        description: "Failed to create team. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto">
            <TeamIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-red-600 dark:text-red-400">Access Denied</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please log in to create teams.</p>
          </div>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-1">
            <div className="bg-white dark:bg-gray-900 rounded-t-lg">
              <CardContent className="pt-12 pb-8">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-white animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Team Created Successfully!
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-gray-50">{formData.name}</span> has been
                      created and is ready for team members.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Link href="/admin/teams">
                      <Button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3">
                        <Sparkles className="w-4 h-4 mr-2" />
                        View All Teams
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSuccess(false)
                        setFormData({
                          name: "",
                          description: "",
                        })
                        setErrors({})
                      }}
                      className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 px-8 py-3"
                    >
                      Create Another Team
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <Link href="/admin/teams">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Button>
            </Link>
            <div className="text-center sm:text-right">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Team
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Build and organize your team structure</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Team Information Card */}
            <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-gray-900">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <TeamIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                        Team Information
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                        Basic details about your new team
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    Team Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={`h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.name ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                    placeholder="Enter team name (e.g., Marketing Team, Development Team)"
                    maxLength={50}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formData.name.length}/50 characters</p>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the team's purpose, responsibilities, and goals..."
                    rows={4}
                    className="rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.description.length}/500 characters (optional)
                  </p>
                </div>

                {/* Preview Section */}
                {formData.name && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                      Team Preview
                    </h3>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <TeamIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-50">{formData.name}</h4>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {formData.description || "No description provided"}
                        </p>
                        <div className="flex items-center mt-3 space-x-4">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                            <Users className="w-3 h-3 mr-1" />0 members
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Ready for members</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <Link href="/admin/teams">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800 px-8 py-3 h-12 rounded-xl transition-all duration-200 bg-transparent"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Team...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Team
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
