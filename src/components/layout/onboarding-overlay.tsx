/**
 * First-launch onboarding overlay
 *
 * Shows a brief welcome message with quick-start steps on first launch.
 * Dismissed once user clicks "Get Started" or navigates away.
 * State persisted in localStorage so it only shows once.
 */

import { RocketLaunchRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Fade,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const ONBOARDING_KEY = "onboarding_completed";

function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function OnboardingOverlay() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => !isOnboardingCompleted());

  if (!visible) return null;

  const handleStart = () => {
    completeOnboarding();
    setVisible(false);
    navigate("/account");
  };

  const handleSkip = () => {
    completeOnboarding();
    setVisible(false);
  };

  return (
    <Fade in={visible}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.background.default, 0.92),
          backdropFilter: "blur(8px)",
        }}
      >
        <Box
          sx={{
            maxWidth: 380,
            textAlign: "center",
            p: 4,
          }}
        >
          {/* Brand icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <RocketLaunchRounded sx={{ fontSize: 32, color: "white" }} />
          </Box>

          <Typography variant="h5" fontWeight={700} gutterBottom>
            {t("account.brand.name")}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, lineHeight: 1.7 }}
          >
            {t("account.brand.tagline")}
          </Typography>

          {/* Steps */}
          <Stack spacing={1.5} sx={{ mb: 4, textAlign: "left" }}>
            {[1, 2, 3].map((step) => (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {step}
                </Box>
                <Typography variant="body2" color="text.primary">
                  {t(`home.onboarding.step${step}` as any)}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleStart}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                py: 1.25,
              }}
            >
              {t("home.onboarding.getStarted" as any)}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={handleSkip}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              {t("home.onboarding.skip" as any)}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Fade>
  );
}
