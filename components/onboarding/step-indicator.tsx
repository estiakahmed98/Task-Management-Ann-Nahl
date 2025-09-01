"use client"

import type React from "react"
import { CheckIcon } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Step {
  id: number
  title: string
  component: React.ComponentType<any>
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepId: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-12">
      <div className="overflow-x-auto pb-4">
        <ol className="flex items-center justify-center gap-4 md:gap-8 min-w-max px-4">
          {steps.map((step, idx) => {
            const isCompleted = step.id < currentStep
            const isActive = step.id === currentStep

            return (
              <li key={step.title} className="relative flex flex-col items-center min-w-0">
                {/* Connector Line */}
                {idx !== 0 && (
                  <span
                    className={cn(
                      "absolute -left-6 md:-left-12 top-5 w-12 md:w-24 h-0.5 transition-colors duration-300",
                      isCompleted ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200",
                    )}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 border-2",
                    isCompleted
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent shadow-lg text-white cursor-pointer hover:shadow-xl hover:scale-105"
                      : isActive
                        ? "bg-white border-purple-500 shadow-lg ring-4 ring-purple-100"
                        : "bg-white border-gray-300 text-gray-400 hover:border-gray-400",
                  )}
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                  role={isCompleted ? "button" : undefined}
                  tabIndex={isCompleted ? 0 : undefined}
                  aria-label={`Step: ${step.title}`}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : isActive ? (
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-3 text-sm text-center font-medium transition-colors duration-300 whitespace-nowrap",
                    isCompleted
                      ? "text-purple-600 hover:text-purple-700 cursor-pointer hover:underline"
                      : isActive
                        ? "text-gray-900 font-semibold"
                        : "text-gray-500",
                  )}
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                  role={isCompleted ? "button" : undefined}
                  tabIndex={isCompleted ? 0 : undefined}
                >
                  {step.title}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
