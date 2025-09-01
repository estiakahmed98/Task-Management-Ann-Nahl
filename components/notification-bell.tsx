// components/notification-bell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  useUnreadCount,
  useNotifications,
  markOneRead,
  markAllRead,
} from "@/lib/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const router = useRouter();

  // SWR hooks
  const {
    count,
    isLoading: countLoading,
    error: countError,
    refresh: refreshCount,
  } = useUnreadCount();

  const {
    list,
    isLoading: listLoading,
    error: listError,
    refresh: refreshList,
  } = useNotifications("onlyUnread=0&take=20");

  // sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCountRef = useRef<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("notifSound") === "on";
  });

  // init audio once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notify.wav");
      audioRef.current.preload = "auto";
      audioRef.current.volume = 1.0;
    }
  }, []);

  // persist preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notifSound", soundEnabled ? "on" : "off");
    }
  }, [soundEnabled]);

  // play sound when unread count increases (skip first load)
  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = count; // baseline
      return;
    }
    const prev = prevCountRef.current;
    if (soundEnabled && count > prev) {
      audioRef.current?.play().catch(() => {
        // autoplay blocked: ignore; user can toggle Sound to grant
      });
      if (typeof navigator?.vibrate === "function" && document.hidden) {
        navigator.vibrate(120);
      }
    }
    prevCountRef.current = count;
  }, [count, soundEnabled]);

  // open one notification
  const openNotification = async (n: any) => {
    await markOneRead(n.id);
    refreshCount();
    refreshList();
    if (n.targetPath) router.push(n.targetPath);
    else if (n.taskId) router.push(`/agent/tasks/${n.taskId}`);
  };

  // header right controls
  const HeaderControls = () => (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-600 inline-flex items-center">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={async (e) => {
            const on = e.target.checked;
            setSoundEnabled(on);
            if (on) {
              try {
                await audioRef.current?.play(); // user gesture → unlock audio
              } catch {}
            }
          }}
          className="mr-1"
        />
        Sound
      </label>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await markAllRead();
          refreshCount();
          refreshList();
        }}
      >
        Mark all read
      </Button>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open notifications"
          className="relative h-7 w-7 text-gray-400 hover:text-gray-600"
        >
          <Bell className="h-3 w-3" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 text-[10px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-medium">Notifications</span>
          <HeaderControls />
        </div>

        {/* states */}
        {countError || listError ? (
          <div className="p-4 text-sm text-red-600">
            Failed to load notifications.
          </div>
        ) : listLoading && countLoading ? (
          <div className="p-4 text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {!list || list.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            ) : (
              list.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b ${
                    n.isRead ? "" : "bg-blue-50"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      n.isRead ? "text-gray-700" : "font-medium"
                    }`}
                  >
                    {n.message}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
