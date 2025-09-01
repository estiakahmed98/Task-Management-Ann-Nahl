"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

interface AssignmentSuccessProps {
  clientName: string;
  templateName: string;
  packageName: string;
  assignmentId?: string;
}

export function AssignmentSuccess({ 
  clientName, 
  templateName, 
  packageName,
  assignmentId 
}: AssignmentSuccessProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <CardTitle className="flex items-center gap-3 text-xl">
          <CheckCircle className="w-6 h-6" />
          Assignment Created Successfully!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{clientName}</p>
                <p className="text-sm text-gray-500">Client</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{templateName}</p>
                <p className="text-sm text-gray-500">Template</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Badge className="bg-green-100 text-green-800 border-green-200 mb-2">
                Package
              </Badge>
              <p className="text-sm font-medium">{packageName}</p>
            </div>
            {assignmentId && (
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
                  Assignment ID
                </Badge>
                <p className="text-xs font-mono">{assignmentId}</p>
              </div>
            )}
          </div>

          <div className="bg-green-100 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Tasks have been automatically generated</li>
              <li>• Team members have been notified</li>
              <li>• Client will receive welcome email</li>
              <li>• Project timeline has been established</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
