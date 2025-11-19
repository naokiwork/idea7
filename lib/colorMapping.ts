/**
 * Color mapping utility for achievement rates
 * Based on the requirements specification
 */

import type { AchievementColor, ColorThemeOption } from "@/types";
import type { CSSProperties } from "react";

/**
 * Get color for a given achievement rate percentage
 * @param rate Achievement rate as percentage (0-150+)
 * @returns Color name for the achievement rate
 */
export function getAchievementColor(rate: number): AchievementColor {
  if (rate < 50) return "white";        // 0%~49% → 白
  if (rate < 60) return "yellow";       // 50%~59% → 黄色
  if (rate < 70) return "green";        // 60%~69% → 緑色
  if (rate < 80) return "brown";        // 70%~79% → 茶色
  if (rate < 90) return "black";        // 80%~89% → 黒
  if (rate < 100) return "black";       // 90%~99% → 黒
  if (rate === 100) return "purple";    // 100% → 紫
  if (rate < 110) return "black";       // 101%~109% → 黒
  if (rate < 120) return "black";       // 110%~119% → 黒
  if (rate < 130) return "brown";       // 120%~129% → 茶色
  if (rate < 140) return "green";       // 130%~139% → 緑色
  if (rate < 150) return "white";       // 140%~149% → 白
  return "white";                       // 150%~ → 白
}

/**
 * Get TailwindCSS class for achievement color
 * @param color Achievement color name
 * @returns TailwindCSS classes for background and border
 */
export function getColorClass(
  color: AchievementColor,
  theme: ColorThemeOption = "classic",
  rate?: number | null
): string {
  if (theme === "green-gradient") {
    return getGreenGradientColorClass(rate);
  }
  if (theme === "github-green") {
    return "border-2";
  }

  const colorMap: Record<AchievementColor, string> = {
    white: "bg-white border-gray-300 border-2",
    yellow: "bg-yellow-400 border-yellow-600 border-2",
    green: "bg-green-400 border-green-600 border-2",
    brown: "bg-amber-700 border-amber-800 border-2",
    blue: "bg-blue-200 border-blue-400 border-2",
    black: "bg-gray-900 border-gray-950 border-2",
    purple: "bg-purple-400 border-purple-600 border-2",
  };
  return colorMap[color] || colorMap.white;
}

export function getTextColorClass(
  color: AchievementColor,
  theme: ColorThemeOption = "classic",
  rate?: number | null
): string {
  if (theme === "green-gradient") {
    const value = rate ?? 0;
    if (value >= 90) {
      return "text-white";
    }
    return "text-emerald-900";
  }
  if (theme === "github-green") {
    const value = rate ?? 0;
    if (value >= 120) return "text-emerald-900";
    if (value >= 80) return "text-emerald-900";
    return "text-emerald-50";
  }

  if (color === "black" || color === "brown") {
    return "text-white";
  }
  if (color === "white") {
    return "text-gray-950";
  }
  return "text-gray-900";
}

function getGreenGradientColorClass(rate?: number | null): string {
  if (rate === null || rate === undefined) {
    return "bg-emerald-50 border-emerald-200 border-2";
  }

  if (rate < 50) return "bg-emerald-50 border-emerald-200 border-2";
  if (rate < 70) return "bg-emerald-100 border-emerald-200 border-2";
  if (rate < 90) return "bg-emerald-200 border-emerald-300 border-2";
  if (rate < 100) return "bg-emerald-300 border-emerald-400 border-2";
  if (rate === 100) return "bg-emerald-400 border-emerald-500 border-2";
  if (rate < 120) return "bg-emerald-500 border-emerald-600 border-2";
  if (rate < 140) return "bg-emerald-600 border-emerald-700 border-2";
  return "bg-emerald-700 border-emerald-800 border-2";
}

function blendColor(start: number[], end: number[], t: number): string {
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getGithubGradientStyle(rate?: number | null): CSSProperties {
  const baseColor = "rgb(24, 30, 18)"; // background for zero achievement
  const startColor: number[] = [47, 91, 0]; // dark 555nm green
  const endColor: number[] = [172, 255, 85]; // light 555nm green
  const clamped = Math.min(Math.max(rate ?? 0, 0), 150);

  if (clamped <= 0) {
    return {
      backgroundColor: baseColor,
      borderColor: "rgba(255,255,255,0.08)",
    };
  }

  const t = Math.min(clamped, 150) / 150;
  const backgroundColor = blendColor(startColor, endColor, t);
  const borderColor = blendColor(startColor, endColor, Math.max(t - 0.2, 0));
  return {
    backgroundColor,
    borderColor,
  };
}

export function getColorStyle(
  color: AchievementColor,
  theme: ColorThemeOption,
  rate?: number | null
): CSSProperties | undefined {
  if (theme === "github-green") {
    return getGithubGradientStyle(rate);
  }
  return undefined;
}

