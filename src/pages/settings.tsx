import {
  HelpOutlineRounded,
  LanguageRounded,
  Telegram,
} from "@mui/icons-material";
import { Box, ButtonGroup, IconButton, Grid } from "@mui/material";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import SettingSystem from "@/components/setting/setting-system";
import SettingVergeAdvanced from "@/components/setting/setting-verge-advanced";
import SettingVergeBasic from "@/components/setting/setting-verge-basic";
import { openWebUrl } from "@/services/cmds";
import { showNotice } from "@/services/notice-service";

// Glass card wrapper style
const glassCard = {
  borderRadius: "var(--glass-radius)",
  background: "var(--glass-bg)",
  backdropFilter: "saturate(180%) blur(var(--glass-blur))",
  WebkitBackdropFilter: "saturate(180%) blur(var(--glass-blur))",
  border: "0.5px solid var(--glass-border)",
  marginBottom: 1.5,
};

const SettingPage = () => {
  const { t } = useTranslation();

  const onError = (err: any) => {
    showNotice.error(err);
  };

  const toWebsite = useLockFn(() => {
    return openWebUrl("https://yue.to");
  });

  const toDoc = useLockFn(() => {
    return openWebUrl("https://yue.to");
  });

  const toTelegramChannel = useLockFn(() => {
    return openWebUrl("https://yue.to");
  });

  return (
    <BasePage
      title={t("settings.page.title")}
      header={
        <ButtonGroup variant="contained" aria-label="Basic button group">
          <IconButton
            size="medium"
            color="inherit"
            title={t("settings.page.actions.manual")}
            onClick={toDoc}
          >
            <HelpOutlineRounded fontSize="inherit" />
          </IconButton>
          <IconButton
            size="medium"
            color="inherit"
            title={t("settings.page.actions.telegram")}
            onClick={toTelegramChannel}
          >
            <Telegram fontSize="inherit" />
          </IconButton>
          <IconButton
            size="medium"
            color="inherit"
            title={t("settings.page.actions.github")}
            onClick={toWebsite}
          >
            <LanguageRounded fontSize="inherit" />
          </IconButton>
        </ButtonGroup>
      }
    >
      <Grid container spacing={1.5} columns={{ xs: 6, sm: 6, md: 12 }}>
        <Grid size={6}>
          <Box sx={glassCard}>
            <SettingSystem onError={onError} />
          </Box>
          <Box sx={glassCard}>
            <SettingVergeBasic onError={onError} />
          </Box>
        </Grid>
        <Grid size={6}>
          <Box sx={glassCard}>
            <SettingVergeAdvanced onError={onError} />
          </Box>
        </Grid>
      </Grid>
    </BasePage>
  );
};

export default SettingPage;
