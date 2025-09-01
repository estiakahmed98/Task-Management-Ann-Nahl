import {
  CalendarDays,
  Check,
  X,
  ExternalLink,
  User,
  Building,
  Clock,
  MapPin,
  Image,
  Star,
  Search,
  ShoppingCart,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClientProfilePage = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Luzy Ostreicher</h1>
          <p className="text-muted-foreground">Client ID: 270DFP</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-600 bg-green-50">
            Active
          </Badge>
          <Button variant="outline">Edit Profile</Button>
          <Button>Contact Client</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Client Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Client Type
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-sm">
                    <User className="h-3.5 w-3.5 mr-1" />
                    Individual
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Tier / Level
                </p>
                <p className="font-medium">270DFP</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Domain
                </p>
                <Link
                  href="https://LuzyOstreicher.com"
                  target="_blank"
                  className="font-medium text-primary flex items-center gap-1"
                >
                  LuzyOstreicher.com
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Keywords
                </p>
                <p className="font-medium">Luzy Ostreicher</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Industry
                </p>
                <p className="font-medium">A Rabbi real estate mogul</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Monsey, NY
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Contract Period</p>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3.5 w-3.5" />8 months
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <div className="flex items-center gap-1 font-medium">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    12-18-2024
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <div className="flex items-center gap-1 font-medium">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    08-18-2025
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Account Management</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Account Manager
                  </p>
                  <p className="font-medium">RL</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">SAD</p>
                  <p className="font-medium">Andrew</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Monthly Reports</p>
              <Link
                href="https://staff.reputationprime"
                target="_blank"
                className="text-primary flex items-center gap-1"
              >
                https://staff.reputationprime
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
            <CardDescription>10 of 10 steps completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={100} className="h-2" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  CQ completed
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Bio sent
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Bio approved
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Welcome email sent
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Client provided images
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Article Titles Sent
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Article Titles Approved
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Assets ordered
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Assets created
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Link Accel Detail/Tier
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Done
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deliverables">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="suppression">Link Suppression</TabsTrigger>
          <TabsTrigger value="addons">Add-Ons</TabsTrigger>
          <TabsTrigger value="social">Social Profiles</TabsTrigger>
          <TabsTrigger value="seo">SEO Platforms</TabsTrigger>
        </TabsList>

        <TabsContent value="deliverables" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Deliverables from SOW</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge>2 GP</Badge>
                  <span className="text-sm text-muted-foreground">
                    General Placements
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppression" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Links to Suppress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <Link
                    href="https://www.duluthmonitor.com/2024/02/09/promoters-of-half-billion-doll"
                    target="_blank"
                    className="text-primary flex items-center gap-1 mb-2"
                  >
                    https://www.duluthmonitor.com/2024/02/09/promoters-of-half-billion-doll
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Target</Badge>
                    <span className="text-sm text-muted-foreground">
                      Priority 1
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <Link
                    href="https://www.duluthmonitor.com/2024/02/25/investigation-finds-no-evide"
                    target="_blank"
                    className="text-primary flex items-center gap-1 mb-2"
                  >
                    https://www.duluthmonitor.com/2024/02/25/investigation-finds-no-evide
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Target</Badge>
                    <span className="text-sm text-muted-foreground">
                      Priority 2
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add-Ons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    Image Suppression Focus
                  </span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not Included
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    Review Mngt
                  </span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not Included
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    Google Business Panel
                  </span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not Included
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    SEO
                  </span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not Included
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    Auto Suggest
                  </span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not Included
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    Other - LINK ACCEL
                  </span>
                  <Badge variant="outline" className="text-red-600 bg-red-50">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Not Included
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">LinkedIn</p>
                    <Badge
                      variant="outline"
                      className="text-amber-600 bg-amber-50"
                    >
                      Not Connected
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Facebook</p>
                    <Badge
                      variant="outline"
                      className="text-amber-600 bg-amber-50"
                    >
                      Not Connected
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Twitter</p>
                    <Badge
                      variant="outline"
                      className="text-amber-600 bg-amber-50"
                    >
                      Not Connected
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Instagram</p>
                    <Badge
                      variant="outline"
                      className="text-amber-600 bg-amber-50"
                    >
                      Not Connected
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">Reddit</p>
                    <Badge
                      variant="outline"
                      className="text-blue-600 bg-blue-50"
                    >
                      Create with client
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Platform
                        </th>
                        <th className="text-left py-3 px-4 font-medium">URL</th>
                        <th className="text-left py-3 px-4 font-medium">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Access Level
                        </th>
                        <th className="text-left py-3 px-4 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Google Analytics</td>
                        <td className="py-3 px-4">
                          <Link
                            href="https://analytics.google.com/analytics/web/"
                            target="_blank"
                            className="text-primary flex items-center gap-1"
                          >
                            analytics.google.com
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          analytics@netreputation.com
                        </td>
                        <td className="py-3 px-4">Full</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="text-red-600 bg-red-50"
                          >
                            Not Confirmed
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Google Search Console</td>
                        <td className="py-3 px-4">
                          <Link
                            href="https://search.google.com/search-console"
                            target="_blank"
                            className="text-primary flex items-center gap-1"
                          >
                            search.google.com
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          analytics@netreputation.com
                        </td>
                        <td className="py-3 px-4">Administrator</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="text-red-600 bg-red-50"
                          >
                            Not Confirmed
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">SEO CC Doc Link</td>
                        <td className="py-3 px-4">(link here)</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">-</td>
                        <td className="py-3 px-4">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Primary Contact</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">Not provided</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">Not provided</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">Not provided</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Secondary Contact</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">Not provided</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">Not provided</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">Not provided</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Update Contact Information</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ClientProfilePage;
