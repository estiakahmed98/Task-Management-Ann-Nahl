import type { Task } from "@/types/task";
import { generateRandomTime } from "./time-utils";

// Initialize tasks for a tab
export const initializeTabTasks = (links: any[]): Task[] => {
  return links.map((link) => ({
    id: link.id,
    link: link.link,
    username: link.username,
    email: link.email,
    password: link.password,
    status: "pending",
    timeAllotted: generateRandomTime(),
    timeRemaining: null,
    timerActive: false,
    timerExpired: false,
    extraTimeSpent: 0,
    totalTimeSpent: 0,
  }));
};
