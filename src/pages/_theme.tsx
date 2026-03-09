import getSystem from "@/utils/get-system";
const OS = getSystem();

const baseFontFamily = `Inter, -apple-system, BlinkMacSystemFont, "Microsoft YaHei UI", "Microsoft YaHei", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
  OS === "windows" ? ", twemoji mozilla" : ""
}`;

// default theme setting (light) — iOS 26 Liquid Glass inspired
export const defaultTheme = {
  primary_color: "#6366F1",
  secondary_color: "#8B5CF6",
  primary_text: "#1C1C1E",
  secondary_text: "#8E8E93",
  info_color: "#5856D6",
  error_color: "#FF3B30",
  warning_color: "#FF9500",
  success_color: "#34C759",
  background_color: "#F2F2F7",
  font_family: baseFontFamily,
};

// dark mode — iOS 26 dark glass
export const defaultDarkTheme = {
  ...defaultTheme,
  primary_color: "#7B7FFF",
  secondary_color: "#A78BFA",
  primary_text: "#F5F5F7",
  background_color: "#000000",
  secondary_text: "#98989D",
  info_color: "#7B7FFF",
  error_color: "#FF453A",
  warning_color: "#FFD60A",
  success_color: "#30D158",
};
