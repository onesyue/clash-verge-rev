import { Paper, alpha } from "@mui/material";
import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  sx?: object;
}

/**
 * Unified iOS 26 Liquid Glass card component.
 * Replaces scattered SurfaceCard / glassCard / Paper patterns.
 */
export function GlassCard({ children, onClick, sx }: GlassCardProps) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={({ palette }) => ({
        borderRadius: "var(--glass-radius)",
        background: "var(--glass-bg)",
        backdropFilter: "saturate(180%) blur(var(--glass-blur))",
        WebkitBackdropFilter: "saturate(180%) blur(var(--glass-blur))",
        border: "0.5px solid var(--glass-border)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        ...(onClick && {
          "&:hover": {
            bgcolor: alpha(
              palette.text.primary,
              palette.mode === "dark" ? 0.08 : 0.04,
            ),
            borderColor: alpha(palette.divider, 1.5),
          },
        }),
        ...sx,
      })}
    >
      {children}
    </Paper>
  );
}
