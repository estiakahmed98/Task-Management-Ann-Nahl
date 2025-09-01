"use client"

import { useState } from "react"
import { Check, ChevronDown, Users, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Template {
  id: string
  name: string
  description: string
  packageId?: string
  status: string
  sitesAssets: Array<{
    id: string
    type: string
    name: string
    url: string
    description: string
    isRequired: boolean
    defaultPostingFrequency?: string
    defaultIdealDurationMinutes?: number
  }>
  templateTeamMembers: Array<{
    id: string
    agent: {
      id: string
      name: string
      email: string
      image: string
    }
  }>
}

interface TemplateSelectorProps {
  templates: Template[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function TemplateSelector({
  templates,
  value,
  onValueChange,
  placeholder = "Select template...",
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedTemplate = templates.find((template) => template.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[2.5rem] p-3 bg-transparent"
        >
          {selectedTemplate ? (
            <div className="flex items-center gap-3 text-left">
              <div className="flex-1">
                <div className="font-medium">{selectedTemplate.name}</div>
                <div className="text-xs text-gray-500 truncate">{selectedTemplate.description}</div>
                <div className="flex items-center gap-2 mt-1">
                  {selectedTemplate.sitesAssets.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      {selectedTemplate.sitesAssets.length} assets
                    </Badge>
                  )}
                  {selectedTemplate.templateTeamMembers.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedTemplate.templateTeamMembers.length} members
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No template found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {templates.map((template) => (
                <CommandItem
                  key={template.id}
                  value={template.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="p-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Check className={cn("h-4 w-4 shrink-0", value === template.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{template.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {template.sitesAssets.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Settings className="h-3 w-3 mr-1" />
                            {template.sitesAssets.length} assets
                          </Badge>
                        )}
                        {template.templateTeamMembers.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {template.templateTeamMembers.length} members
                          </Badge>
                        )}
                      </div>
                      {template.templateTeamMembers.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-gray-500">Recommended:</span>
                          <div className="flex -space-x-1">
                            {template.templateTeamMembers.slice(0, 3).map((member) => (
                              <Avatar key={member.id} className="h-5 w-5 border border-white">
                                <AvatarImage src={member.agent.image || "/placeholder.svg"} alt={member.agent.name} />
                                <AvatarFallback className="text-xs">{member.agent.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                            ))}
                            {template.templateTeamMembers.length > 3 && (
                              <div className="h-5 w-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs">
                                +{template.templateTeamMembers.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
