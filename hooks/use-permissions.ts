"use client"
import { useEffect, useState } from "react"

interface Permission {
  id: string
  name: string
  description?: string
}

interface UserPermissions {
  permissions: string[]
  isAdmin: boolean
}

export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    permissions: [],
    isAdmin: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        // Replace this with your actual user/auth API call
        const response = await fetch("/api/user/permissions")
        const data = await response.json()

        if (data.success) {
          setUserPermissions({
            permissions: data.permissions || [],
            isAdmin: data.isAdmin || false,
          })
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserPermissions()
  }, [])

  const hasPermission = (permissionId: string): boolean => {
    // Admin has all permissions
    if (userPermissions.isAdmin) return true

    // Check if user has specific permission
    return userPermissions.permissions.includes(permissionId)
  }

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    // Admin has all permissions
    if (userPermissions.isAdmin) return true

    // Check if user has any of the specified permissions
    return permissionIds.some((permissionId) => userPermissions.permissions.includes(permissionId))
  }

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    isLoading,
  }
}
