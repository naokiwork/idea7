/**
 * Color mapping utility for achievement rates
 * Based on the requirements specification
 */

import type { AchievementColor } from "@/types";

/**
 * Get color for a given achievement rate percentage
 * @param rate Achievement rate as percentage (0-150+)
 * @returns Color name for the achievement rate
 */
export function getAchievementColor(rate: number): AchievementColor {
  if (rate < 50) return "white";
  if (rate < 60) return "yellow";
  if (rate < 70) return "green";
  if (rate < 80) return "brown";
  if (rate < 90) return "blue";
  if (rate < 100) return "black";
  if (rate === 100) return "purple";
  if (rate < 120) return "black";
  if (rate < 130) return "purple";
  if (rate < 140) return "green";
  if (rate < 150) return "white";
  return "white"; // 150%+
}

/**
 * Get TailwindCSS class for achievement color
 */
export function getColorClass(color: AchievementColor): string {
  const colorMap: Record<AchievementColor, string> = {
    white: "bg-white border-gray-200",
    yellow: "bg-yellow-200 border-yellow-300",
    green: "bg-green-200 border-green-300",
    brown: "bg-amber-700 border-amber-800",
    blue: "bg-blue-200 border-blue-300",
    black: "bg-gray-900 border-gray-950",
    purple: "bg-purple-200 border-purple-300",
  };
  return colorMap[color] || colorMap.white;
}

