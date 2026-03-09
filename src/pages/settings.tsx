import { HelpOutlineRounded } from "@mui/icons-material";
import { IconButton, Grid } from "@mui/material";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import SettingSystem from "@/components/setting/setting-system";
import SettingVergeAdvanced from "@/components/setting/setting-verge-advanced";
import SettingVergeBasic from "@/components/setting/setting-verge-basic";
import { GlassCard } from "@/components/shared/glass-card";
import { openWebUrl } from "@/services/cmds";
import { showNotice } from "@/services/notice-service";

const SettingPage = () => {
  const { t } = useTranslation();

  const onError = (err: any) => {
    showNotice.error(err);
  };

  const toDoc = useLockFn(() => {
    return openWebUrl("https://yue.to");
  });

  return (
    <BasePage
      title={t("settings.page.title")}
      header={
        <IconButton
          size="medium"
          color="inherit"
          title={t("settings.page.actions.manual")}
          onClick={toDoc}
        >
          <HelpOutlineRounded fontSize="inherit" />
        </IconButton>
      }
    >
      <Grid container spacing={1.5} columns={{ xs: 6, sm: 6, md: 12 }}>
        <Grid size={6}>
          <GlassCard sx={{ mb: 1.5 }}>
            <SettingSystem onError={onError} />
          </GlassCard>
          <GlassCard sx={{ mb: 1.5 }}>
            <SettingVergeBasic onError={onError} />
          </GlassCard>
        </Grid>
        <Grid size={6}>
          <GlassCard sx={{ mb: 1.5 }}>
            <SettingVergeAdvanced onError={onError} />
          </GlassCard>
        </Grid>
      </Grid>
    </BasePage>
  );
};

export default SettingPage;
