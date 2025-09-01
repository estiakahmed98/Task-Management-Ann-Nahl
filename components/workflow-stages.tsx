"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface WorkflowData {
  assets: { total: number; completed: number }
  socialMedia: { total: number; completed: number }
  review: { total: number; completed: number }
}

interface WorkflowStagesProps {
  workflowData: WorkflowData
}

export function WorkflowStages({ workflowData }: WorkflowStagesProps) {
  const [reviewProgress, setReviewProgress] = useState(0)

  useEffect(() => {
    // Animate the review progress
    const reviewPercentage = Math.round((workflowData.review.completed / workflowData.review.total) * 100)
    let currentProgress = 0

    const interval = setInterval(() => {
      if (currentProgress < reviewPercentage) {
        currentProgress += 1
        setReviewProgress(currentProgress)
      } else {
        clearInterval(interval)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [workflowData.review])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
          <WorkflowStage
            title="Assets Completion"
            completed={workflowData.assets.completed}
            total={workflowData.assets.total}
          />

          <ArrowRight className="hidden md:block h-8 w-8 text-muted-foreground" />

          <WorkflowStage
            title="Social Media"
            completed={workflowData.socialMedia.completed}
            total={workflowData.socialMedia.total}
          />

          <ArrowRight className="hidden md:block h-8 w-8 text-muted-foreground" />

          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-3">Review</h3>
            <div className="relative h-24 w-24">
              <svg className="h-24 w-24" viewBox="0 0 100 100">
                <circle
                  className="text-muted-foreground/20 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-primary stroke-current"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                  style={{
                    strokeDasharray: 264,
                    strokeDashoffset: 264 - (264 * reviewProgress) / 100,
                    transition: "stroke-dashoffset 0.5s ease-in-out",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{reviewProgress}%</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {workflowData.review.completed}/{workflowData.review.total} completed
            </p>
          </div>

          <ArrowRight className="hidden md:block h-8 w-8 text-muted-foreground" />

          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-3">Finish</h3>
            <div className="h-24 w-24 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Project completion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface WorkflowStageProps {
  title: string
  completed: number
  total: number
}

function WorkflowStage({ title, completed, total }: WorkflowStageProps) {
  const percentage = Math.round((completed / total) * 100)

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24" viewBox="0 0 100 100">
          <circle
            className="text-muted-foreground/20 stroke-current"
            strokeWidth="8"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary stroke-current"
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            style={{
              strokeDasharray: 264,
              strokeDashoffset: 264 - (264 * percentage) / 100,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{percentage}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {completed}/{total} completed
      </p>
    </div>
  )
}

