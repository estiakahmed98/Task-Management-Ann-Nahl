"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { StepProps } from "@/types/onboarding"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

export function BiographyInfo({ formData, updateFormData, onNext, onPrevious }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateBio = async () => {
    setIsGenerating(true)
    let progress = 0

    // Show initial toast
    const toastId = toast.loading("Generating biography: 0% complete")

    // Update progress every 2 seconds
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5 // Random progress between 5-20%

      if (progress >= 100) {
        progress = 100
        clearInterval(progressInterval)
      }

      toast.loading(`Generating biography: ${progress}% complete`, {
        id: toastId,
      })
    }, 2000)

    // Mock AI generation with a timeout
    setTimeout(() => {
      const generatedBio = `I am ${formData.name || "a passionate professional"} with extensive experience in ${
        formData.company || "my field"
      }. ${
        formData.designation ? `As a ${formData.designation}, I bring ` : "I bring "
      }a unique blend of expertise and innovation to every project.

My journey has been marked by continuous learning and growth, always striving to deliver exceptional results. I believe in the power of collaboration and building meaningful relationships with clients and colleagues alike.

${
  formData.location ? `Based in ${formData.location}, I ` : "I "
}am committed to excellence and take pride in helping businesses achieve their goals through strategic thinking and creative solutions.

When I'm not working, I enjoy exploring new technologies, staying updated with industry trends, and contributing to community initiatives that make a positive impact.`

      updateFormData({ biography: generatedBio })
      setIsGenerating(false)
      clearInterval(progressInterval)

      // Show completion toast
      toast.success("Your AI-generated biography is ready!", {
        id: toastId,
        duration: 5000,
      })
    }, 8000) // 8 seconds for generation
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Your Biography</h1>
        <p className="text-gray-500 mt-2">
          Tell us about yourself or let our AI help you create a compelling biography.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="biography">Biography</Label>
          <Button
            onClick={handleGenerateBio}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="relative group overflow-hidden bg-transparent"
          >
            <span className="relative z-10 flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate with AI"}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
          </Button>
        </div>

        <Textarea
          id="biography"
          value={formData.biography || ""}
          onChange={(e) => updateFormData({ biography: e.target.value })}
          placeholder="Write about yourself, your experience, achievements, and what makes you unique..."
          className="min-h-[300px] resize-none"
          disabled={isGenerating}
        />

        <p className="text-sm text-gray-500">
          This biography will be used across your profiles and marketing materials. Make it engaging and professional.
        </p>
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
