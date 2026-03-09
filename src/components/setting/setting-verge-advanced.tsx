import { ContentCopyRounded } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import { DialogRef, Switch, TooltipIcon } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import { exitApp } from "@/services/cmds";
import { showNotice } from "@/services/notice-service";
import { checkUpdateSafe as checkUpdate } from "@/services/update";
import { version } from "@root/package.json";

import { BackupViewer } from "./mods/backup-viewer";
import { SettingItem, SettingList } from "./mods/setting-comp";
import { UpdateViewer } from "./mods/update-viewer";

interface Props {
  onError?: (err: Error) => void;
}

const SettingVergeAdvanced = ({ onError: _ }: Props) => {
  const { t } = useTranslation();
  const { verge, patchVerge, mutateVerge } = useVerge();

  const backupRef = useRef<DialogRef>(null);
  const updateRef = useRef<DialogRef>(null);

  const onCheckUpdate = async () => {
    try {
      const info = await checkUpdate();
      if (!info?.available) {
        showNotice.success(
          "settings.components.verge.advanced.notifications.latestVersion",
        );
      } else {
        updateRef.current?.open();
      }
    } catch (err: any) {
      showNotice.error(err);
    }
  };

  const copyVersion = useCallback(() => {
    navigator.clipboard.writeText(`v${version}`).then(() => {
      showNotice.success(
        "settings.components.verge.advanced.notifications.versionCopied",
        1000,
      );
    });
  }, []);

  return (
    <SettingList title={t("settings.components.verge.advanced.title")}>
      <BackupViewer ref={backupRef} />
      <UpdateViewer ref={updateRef} />

      <SettingItem
        onClick={() => backupRef.current?.open()}
        label={t("settings.components.verge.advanced.fields.backupSetting")}
        extra={
          <TooltipIcon
            title={t("settings.components.verge.advanced.tooltips.backupInfo")}
            sx={{ opacity: "0.7" }}
          />
        }
      />

      <SettingItem
        onClick={onCheckUpdate}
        label={t("settings.components.verge.advanced.fields.checkUpdates")}
      >
        <Switch
          edge="end"
          checked={verge?.auto_check_update !== false}
          onChange={(_, c) => {
            mutateVerge((v) => ({ ...v!, auto_check_update: c }), false);
            patchVerge({ auto_check_update: c }).catch((e) => {
              showNotice.error(e);
              mutateVerge();
            });
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </SettingItem>

      <SettingItem
        onClick={() => {
          exitApp();
        }}
        label={t("settings.components.verge.advanced.fields.exit")}
      />

      <SettingItem
        label={t("settings.components.verge.advanced.fields.vergeVersion")}
        extra={
          <TooltipIcon
            icon={ContentCopyRounded}
            onClick={copyVersion}
            title={t("settings.components.verge.advanced.actions.copyVersion")}
          />
        }
      >
        <Typography sx={{ py: "7px", pr: 1 }}>v{version}</Typography>
      </SettingItem>
    </SettingList>
  );
};

export default SettingVergeAdvanced;
