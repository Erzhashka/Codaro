import type { NicheModeConfig } from "../types";

export const NICHE_MODE_CONFIGS: Record<NicheModeConfig["mode"], NicheModeConfig> = {
  focus: {
    mode: "focus",
    title: "Focus Hub",
    description: "Deep work sessions and accountability circles.",
    interactionLabel: "Respect",
    navigationItems: [
      { id: "feed", label: "Feed", href: "#feed" },
      { id: "rooms", label: "Rooms", href: "#rooms" },
      { id: "presence", label: "Online", href: "#presence" },
      { id: "profile", label: "Profile", href: "#profile" },
    ],
  },
  fitness: {
    mode: "fitness",
    title: "Fitness Clan",
    description: "Training streaks, weekly challenges, and recovery check-ins.",
    interactionLabel: "Energy",
    navigationItems: [
      { id: "feed", label: "Feed", href: "#feed" },
      { id: "workouts", label: "Workouts", href: "#workouts" },
      { id: "presence", label: "Online", href: "#presence" },
      { id: "profile", label: "Profile", href: "#profile" },
    ],
  },
  creative: {
    mode: "creative",
    title: "Creative Loop",
    description: "Daily prompts, feedback swaps, and shipping rituals.",
    interactionLabel: "Support",
    navigationItems: [
      { id: "feed", label: "Feed", href: "#feed" },
      { id: "prompts", label: "Prompts", href: "#prompts" },
      { id: "presence", label: "Online", href: "#presence" },
      { id: "profile", label: "Profile", href: "#profile" },
    ],
  },
};