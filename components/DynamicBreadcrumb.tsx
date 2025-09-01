"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Optional: mapping for nicer titles
const titles: Record<string, string> = {
  admin: "Admin",
  agents: "Agents",
  users: "Users",
  packages: "Packages",
};

export default function DynamicBreadcrumb() {
  const pathname = usePathname(); 
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      {/* ✅ flex so that items come side by side */}
      <BreadcrumbList className="flex items-center space-x-1">
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;

          return (
            <BreadcrumbItem key={href} className="inline-flex items-center">
              {!isLast ? (
                <>
                  <BreadcrumbLink href={href}>
                    {titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator className="mx-1" />
                </>
              ) : (
                <BreadcrumbPage>
                  {titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
