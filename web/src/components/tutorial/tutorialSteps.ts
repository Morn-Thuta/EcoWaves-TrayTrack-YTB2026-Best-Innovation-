export type Placement = "top" | "bottom" | "left" | "right" | "center";

export interface TutorialStep {
  id: number;
  route: string | null;
  selector: string | null;
  placement: Placement;
  padding: number;
  icon: string;
  title: string;
  description: string;
}

export const TUTORIAL_STORAGE_KEY = "tray_monitor_tutorial_done";

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    route: null,
    selector: null,
    placement: "center",
    padding: 0,
    icon: "👋",
    title: "Welcome",
    description:
      "Smart tray sensors keep the kitchen on top of food waste. Let's take 90 seconds.",
  },
  {
    id: 1,
    route: "/manage/config",
    selector: 'a[href="/manage/config"]',
    placement: "bottom",
    padding: 6,
    icon: "⚙️",
    title: "Stations Tab",
    description:
      "Set up your dishes and sensors here. Start with this tab.",
  },
  {
    id: 2,
    route: "/manage/config",
    selector: "#tour-dish-config",
    placement: "bottom",
    padding: 12,
    icon: "🍽️",
    title: "Dish Configuration",
    description:
      "Add each dish, its tray weight, and the cook-trigger level.",
  },
  {
    id: 3,
    route: "/manage/config",
    selector: "#tour-station-mapping",
    placement: "top",
    padding: 12,
    icon: "📡",
    title: "Station Mapping",
    description:
      "Link each sensor to a dish — live weights flow to the chef screen.",
  },
  {
    id: 4,
    route: "/manage/guests",
    selector: 'a[href="/manage/guests"]',
    placement: "bottom",
    padding: 6,
    icon: "🕐",
    title: "Service Tab",
    description:
      "Daily guest count and service window live here.",
  },
  {
    id: 5,
    route: "/manage/guests",
    selector: "#tour-current-pax",
    placement: "right",
    padding: 12,
    icon: "👥",
    title: "Today's Pax",
    description:
      "More guests = bigger cook portions. Enter the count here.",
  },
  {
    id: 6,
    route: "/manage/guests",
    selector: "#tour-service-timer",
    placement: "left",
    padding: 12,
    icon: "⏱️",
    title: "Service Window",
    description:
      "Drives the countdown on the chef screen. Green → amber → red.",
  },
  {
    id: 7,
    route: "/manage/guests",
    selector: "#tour-notify-chef",
    placement: "left",
    padding: 12,
    icon: "🪑",
    title: "Notify Kitchen",
    description:
      "Big table seated? Send an instant alert to the chef TV.",
  },
  {
    id: 8,
    route: "/manage/analytics",
    selector: 'a[href="/manage/analytics"]',
    placement: "bottom",
    padding: 6,
    icon: "📊",
    title: "Analytics",
    description:
      "Spot waste trends and over-prep patterns over time.",
  },
  {
    id: 9,
    route: "/manage/config",
    selector: "#tour-chef-view-link",
    placement: "bottom",
    padding: 8,
    icon: "📺",
    title: "Chef View",
    description:
      "The kitchen TV display. Open it on a wall-mounted screen.",
  },
  {
    id: 10,
    route: null,
    selector: null,
    placement: "center",
    padding: 0,
    icon: "✅",
    title: "You're Set",
    description:
      "Add dishes → enter pax → open the chef screen. Reopen this tour any time via the ? button.",
  },
];
