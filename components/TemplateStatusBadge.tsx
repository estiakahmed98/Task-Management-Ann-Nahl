// src/components/TemplateStatusBadge.tsx
import { Badge, badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

interface TemplateStatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status?: string
}

export function TemplateStatusBadge({ status, ...props }: TemplateStatusBadgeProps) {
  const statusMap: Record<string, { label: string; variant: VariantProps<typeof badgeVariants>['variant'] }> = {
    active: { label: 'Active', variant: 'default' },
    inactive: { label: 'Inactive', variant: 'secondary' },
    draft: { label: 'Draft', variant: 'outline' },
  }

  const currentStatus = status || 'active'

  return (
    <Badge variant={statusMap[currentStatus].variant} {...props}>
      {statusMap[currentStatus].label}
    </Badge>
  )
}