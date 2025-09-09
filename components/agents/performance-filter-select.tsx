"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type PerformanceFilter = "today" | "weekly" | "monthly" | "yearly" | "all";

export default function PerformanceFilterSelect({
  value,
}: {
  value: PerformanceFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onValueChange = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("filter", val);
      // Use replace so it doesn't add to history for every change
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-700">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today's Performance</SelectItem>
        <SelectItem value="weekly">Weekly Performance</SelectItem>
        <SelectItem value="monthly">Monthly Performance</SelectItem>
        <SelectItem value="yearly">Yearly Performance</SelectItem>
        <SelectItem value="all">All Time Performance</SelectItem>
      </SelectContent>
    </Select>
  );
}
