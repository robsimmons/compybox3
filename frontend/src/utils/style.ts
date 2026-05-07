export type SimpleStatus = "neutral" | "stale" | "working" | "success" | "warning" | "failure";

export function strokeCSS(st: SimpleStatus) {
  switch (st) {
    case "failure":
      return "oklch(0.5654 0.26 27.77)";
    case "success":
      return "oklch(0.5654 0.1835 262.86)";
    case "warning":
      return "oklch(0.5654 0.26 27.77)";
    case "working":
      return "oklch(0.5654 0 0)";
    case "stale":
    case "neutral":
      return "oklch(0.5654 0 0)";
  }
}

export function bgCSS(st: SimpleStatus) {
  switch (st) {
    case "failure":
      return "oklch(0.95 0.0321 27.77)";
    case "success":
      return "oklch(0.95 0.1835 262.86)";
    case "warning":
      return "oklch(0.95 0.0321 27.77)";
    case "working":
      return "oklch(0.95 0 0)";
    case "stale":
    case "neutral":
      return "oklch(0.95 0 0)";
  }
}
