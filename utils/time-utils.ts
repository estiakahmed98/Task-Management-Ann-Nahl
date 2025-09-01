// Function to generate random time between 30 seconds and 3 minutes
export const generateRandomTime = (): number => {
  return Math.floor(Math.random() * (180 - 30 + 1)) + 30; // 30 to 180 seconds
};

// Format seconds to MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
