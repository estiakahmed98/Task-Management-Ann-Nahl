"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from "sonner";

interface PackageData {
  id: string;
  name: string;
  description: string;
  _count?: {
    clients: number;
    templates: number;
  };
}

export function PackageInfo({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: any) {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string>(formData.packageId || "");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/packages");
        const data = await res.json();
        setPackages(data);
        toast.success("Packages loaded successfully!");
      } catch (error) {
        console.error("Error fetching packages:", error);
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    updateFormData({ packageId, templateId: "" }); // Reset template when package changes
    toast.success("Package selected successfully!");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Select Package
          </h1>
          <p className="text-gray-500 mt-2">Loading available packages...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Select Package
        </h1>
        <p className="text-gray-500 mt-2">
          Choose the package that best suits your project needs and requirements.
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Packages Available</h3>
          <p className="text-gray-500">Please contact support to set up packages for your organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                selectedPackage === pkg.id 
                  ? 'ring-2 ring-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              {selectedPackage === pkg.id && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-blue-500 rounded-full p-1">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  {pkg.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 line-clamp-3">
                  {pkg.description || "A comprehensive package designed to meet your business needs."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    {pkg._count?.templates && (
                      <Badge variant="secondary" className="text-xs">
                        {pkg._count.templates} Templates
                      </Badge>
                    )}
                    {pkg._count?.clients && (
                      <Badge variant="outline" className="text-xs">
                        {pkg._count.clients} Clients
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button 
                  className={`w-full transition-all duration-200 ${
                    selectedPackage === pkg.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-100 hover:to-purple-100 text-gray-700 hover:text-blue-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePackageSelect(pkg.id);
                  }}
                >
                  {selectedPackage === pkg.id ? 'Selected' : 'Select Package'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:border-blue-300"
        >
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!selectedPackage}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
