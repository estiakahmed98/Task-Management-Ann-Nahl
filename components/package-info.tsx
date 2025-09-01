"use client";

import { Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PackageInfo() {
  const packageDetails = {
    name: "DFP90",
    duration: "90 Days",
    socialSites: 11,
    web2Sites: 5,
    additionalAssets: 10,
    monthlyEngagement: 1,
    domain: 1,
    startDate: "March 15, 2023",
    endDate: "June 13, 2023",
    progress: 13,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Package Information
        </CardTitle>
        <Package className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Package Name</span>
          <span className="font-semibold">{packageDetails.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Duration</span>
          <span>{packageDetails.duration}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Social Sites</span>
          <span>{packageDetails.socialSites}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Web 2.0s</span>
          <span>{packageDetails.web2Sites} Sites</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Additional Assets</span>
          <span>{packageDetails.additionalAssets} Approx</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monthly Engagement</span>
          <span>{packageDetails.monthlyEngagement}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Domain</span>
          <span>{packageDetails.domain}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Start Date</span>
          <span>{packageDetails.startDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">End Date</span>
          <span>{packageDetails.endDate}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span>{packageDetails.progress}%</span>
          </div>
          <Progress value={packageDetails.progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
