import getSystem from "@/utils/get-system";
const OS = getSystem();

const baseFontFamily = `Inter, -apple-system, BlinkMacSystemFont, "Microsoft YaHei UI", "Microsoft YaHei", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
  OS === "windows" ? ", twemoji mozilla" : ""
}`;

// default theme setting (light)
export const defaultTheme = {
  primary_color: "#6366F1",
  secondary_color: "#8B5CF6",
  primary_text: "#1E293B",
  secondary_text: "#64748B",
  info_color: "#6366F1",
  error_color: "#EF4444",
  warning_color: "#F59E0B",
  success_color: "#10B981",
  background_color: "#F1F5F9",
  font_family: baseFontFamily,
};

// dark mode — Minimalist Cyberpunk palette
export const defaultDarkTheme = {
  ...defaultTheme,
  primary_color: "#6366F1",
  secondary_color: "#8B5CF6",
  primary_text: "#F1F5F9",
  background_color: "#0F172A",
  secondary_text: "#94A3B8",
  info_color: "#6366F1",
  error_color: "#EF4444",
  warning_color: "#F59E0B",
  success_color: "#10B981",
};
