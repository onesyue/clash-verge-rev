import { ContentCopyRounded, SettingsRounded } from "@mui/icons-material";
import { TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useLockFn } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogRef, Switch, TooltipIcon } from "@/components/base";
import { useClash } from "@/hooks/use-clash";
import { useVerge } from "@/hooks/use-verge";
import { exitApp } from "@/services/cmds";
import { showNotice } from "@/services/notice-service";
import { checkUpdateSafe as checkUpdate } from "@/services/update";
import { version as rawVersion } from "@root/package.json";

/** Format version for display: "1.0.0-alpha" → "1.0.0.Alpha", "1.0.0" → "1.0.0" */
const version = rawVersion.replace(/-alpha$/i, ".Alpha");

import { BackupViewer } from "./mods/backup-viewer";
import { ClashPortViewer } from "./mods/clash-port-viewer";
import { DnsViewer } from "./mods/dns-viewer";
import { SettingItem, SettingList } from "./mods/setting-comp";
import { ThemeViewer } from "./mods/theme-viewer";
import { UpdateViewer } from "./mods/update-viewer";

interface Props {
  onError?: (err: Error) => void;
}

const SettingVergeAdvanced = ({ onError: _ }: Props) => {
  const { t } = useTranslation();
  const { verge, patchVerge, mutateVerge } = useVerge();
  const { mutateClash } = useClash();

  const updateRef = useRef<DialogRef>(null);
  const backupRef = useRef<DialogRef>(null);
  const portRef = useRef<DialogRef>(null);
  const dnsRef = useRef<DialogRef>(null);
  const themeRef = useRef<DialogRef>(null);

  const { verge_mixed_port } = verge ?? {};

  // DNS toggle state
  const [dnsEnabled, setDnsEnabled] = useState(
    () => verge?.enable_dns_settings ?? false,
  );

  const handleDnsToggle = useLockFn(async (enable: boolean) => {
    try {
      setDnsEnabled(enable);
      localStorage.setItem("dns_settings_enabled", String(enable));
      await patchVerge({ enable_dns_settings: enable });
      await invoke("apply_dns_config", { apply: enable });
      setTimeout(() => mutateClash(), 500);
    } catch (err: any) {
      setDnsEnabled(!enable);
      localStorage.setItem("dns_settings_enabled", String(!enable));
      showNotice.error(err);
      await patchVerge({ enable_dns_settings: !enable }).catch(() => {});
      throw err;
    }
  });

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
      <UpdateViewer ref={updateRef} />
      <BackupViewer ref={backupRef} />
      <ClashPortViewer ref={portRef} />
      <DnsViewer ref={dnsRef} />
      <ThemeViewer ref={themeRef} />

      {/* Theme customization */}
      <SettingItem
        onClick={() => themeRef.current?.open()}
        label={t("settings.components.verge.basic.fields.themeSetting")}
      />

      {/* DNS overwrite */}
      <SettingItem
        label={t("settings.sections.clash.form.fields.dnsOverwrite")}
        extra={
          <TooltipIcon
            icon={SettingsRounded}
            onClick={() => dnsRef.current?.open()}
          />
        }
      >
        <Switch
          edge="end"
          checked={dnsEnabled}
          onChange={(_, checked) => handleDnsToggle(checked)}
        />
      </SettingItem>

      {/* Port config */}
      <SettingItem label={t("settings.sections.clash.form.fields.portConfig")}>
        <TextField
          autoComplete="new-password"
          size="small"
          value={verge_mixed_port ?? 7897}
          sx={{ width: 100, input: { py: "7.5px", cursor: "pointer" } }}
          onClick={(e) => {
            portRef.current?.open();
            (e.target as any).blur();
          }}
        />
      </SettingItem>

      {/* Backup */}
      <SettingItem
        onClick={() => backupRef.current?.open()}
        label={t("settings.components.verge.advanced.fields.backupSetting")}
      />

      {/* Check for updates */}
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

      {/* Exit */}
      <SettingItem
        onClick={() => exitApp()}
        label={t("settings.components.verge.advanced.fields.exit")}
      />

      {/* Version */}
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
