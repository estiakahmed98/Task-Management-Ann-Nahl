import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Package } from "lucide-react"

interface ClientData {
  name: string
  package: string
  tasksPerMonth: number
  tasksCompleted: number
  nextTaskDate: string
  daysUntilNextTask: number
}

interface ClientStatsProps {
  clientData: ClientData
}

export function ClientStats({ clientData }: ClientStatsProps) {
  return (
    <Card className="w-full md:w-auto">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Package</p>
              <p className="text-lg font-bold">{clientData.package}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Tasks</p>
              <p className="text-lg font-bold">
                {clientData.tasksCompleted}/{clientData.tasksPerMonth}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Next Task</p>
              <p className="text-lg font-bold">{clientData.daysUntilNextTask} days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

