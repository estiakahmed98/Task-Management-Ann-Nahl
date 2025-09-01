"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useNotifications,
  markOneRead,
  markAllRead,
} from "@/lib/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, X } from "lucide-react";

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = (today.getTime() - that.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString();
}

function useDebounced<T>(val: T, delay = 400) {
  const [v, setV] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setV(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return v;
}

export default function Notifications() {
  // filters state
  const [type, setType] = useState<string>("all");
  const [readState, setReadState] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const qDeb = useDebounced(q, 400);

  // build query string for hook
  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("take", "100");
    params.set("sort", sort);
    if (type !== "all") params.set("type", type);
    if (readState === "unread") params.set("isRead", "false");
    if (readState === "read") params.set("isRead", "true");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (qDeb) params.set("q", qDeb);
    return params.toString();
  }, [type, readState, from, to, qDeb, sort]);

  const { list, isLoading, error, refresh } = useNotifications(query);

  // group by day label
  const grouped = useMemo(() => {
    const map: Record<string, typeof list> = {};
    const sorted = list
      .slice()
      .sort((a, b) =>
        sort === "desc"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    sorted.forEach((n) => {
      const key = formatDateHeader(n.createdAt);
      (map[key] ||= []).push(n);
    });
    return map;
  }, [list, sort]);

  // Reset all filters
  const resetFilters = () => {
    setType("all");
    setReadState("all");
    setFrom("");
    setTo("");
    setQ("");
    setSort("desc");
  };

  // Check if any filter is active
  const hasActiveFilters =
    type !== "all" ||
    readState !== "all" ||
    from !== "" ||
    to !== "" ||
    q !== "" ||
    sort !== "desc";

  return (
    <div className="container mx-auto p-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Notifications</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={
                    showFilters || hasActiveFilters ? "default" : "outline"
                  }
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {showFilters ? <X size={16} /> : <Filter size={16} />}
                  {showFilters ? "Hide" : "Filter"}
                  {hasActiveFilters && !showFilters && (
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await markAllRead();
                    refresh();
                  }}
                  size="sm"
                >
                  Mark all read
                </Button>
              </div>
            </div>

            {/* Search bar - always visible */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters - conditionally rendered */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
                {/* Type */}
                <div className="md:col-span-1">
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="frequency_missed">
                        Frequency missed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Read state */}
                <div className="md:col-span-1">
                  <Select value={readState} onValueChange={setReadState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Read state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread only</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* From */}
                <div className="md:col-span-1">
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="From date"
                  />
                </div>

                {/* To */}
                <div className="md:col-span-1">
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="To date"
                  />
                </div>

                {/* Sort */}
                <div className="md:col-span-1">
                  <Select
                    value={sort}
                    onValueChange={(v: "asc" | "desc") => setSort(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest first</SelectItem>
                      <SelectItem value="asc">Oldest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset button */}
                <div className="md:col-span-1">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full"
                    disabled={!hasActiveFilters}
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="text-red-600">Failed to load notifications.</div>
          )}
          {isLoading && <div className="text-gray-500">Loading…</div>}

          {!isLoading && !error && list.length === 0 && (
            <div className="text-gray-500">No notifications found.</div>
          )}

          {!isLoading &&
            !error &&
            Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel} className="mb-6">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  {dateLabel}
                </div>
                <div className="divide-y rounded-lg border">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 flex items-start justify-between ${
                        n.isRead ? "" : "bg-blue-50/60"
                      }`}
                    >
                      <div className="pr-3">
                        <div className="text-sm">{n.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-1">
                          <Badge variant="outline">{n.type}</Badge>
                          {n.taskId && (
                            <Badge className="ml-2" variant="secondary">
                              task: {String(n.taskId).slice(0, 6)}…
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!n.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await markOneRead(n.id);
                              refresh();
                            }}
                          >
                            Mark read
                          </Button>
                        )}
                        {(n as any).targetPath && (
                          <Button
                            size="sm"
                            onClick={() =>
                              (window.location.href = (n as any).targetPath!)
                            }
                          >
                            Open
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
