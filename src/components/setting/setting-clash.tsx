import { LanRounded, SettingsRounded } from "@mui/icons-material";
import { MenuItem, Select, TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useLockFn } from "ahooks";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogRef, Switch, TooltipIcon } from "@/components/base";
import { useClash } from "@/hooks/use-clash";
import {
  GEO_INTERVAL_OPTIONS,
  type GeoIntervalHours,
  useGeoAutoUpdate,
} from "@/hooks/use-geo-auto-update";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/notice-service";

import { ClashPortViewer } from "./mods/clash-port-viewer";
import { DnsViewer } from "./mods/dns-viewer";
import { GuardState } from "./mods/guard-state";
import { NetworkInterfaceViewer } from "./mods/network-interface-viewer";
import { SettingItem, SettingList } from "./mods/setting-comp";

interface Props {
  onError: (err: Error) => void;
}

const SettingClash = ({ onError }: Props) => {
  const { t } = useTranslation();

  const { clash, version, mutateClash, patchClash } = useClash();
  const { verge, patchVerge, mutateVerge } = useVerge();

  const {
    ipv6,
    "allow-lan": allowLan,
    "unified-delay": unifiedDelay,
  } = clash ?? {};

  const { verge_mixed_port } = verge ?? {};

  const [dnsSettingsEnabled, setDnsSettingsEnabled] = useState(() => {
    return verge?.enable_dns_settings ?? false;
  });

  useEffect(() => {
    if (verge?.enable_dns_settings != null) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setDnsSettingsEnabled(verge.enable_dns_settings);
    }
  }, [verge?.enable_dns_settings]);

  const portRef = useRef<DialogRef>(null);
  const networkRef = useRef<DialogRef>(null);
  const dnsRef = useRef<DialogRef>(null);

  const onSwitchFormat = (_e: any, value: boolean) => value;
  const onChangeData = (patch: Partial<IConfigData>) => {
    mutateClash((old) => ({ ...old!, ...patch }), false);
  };
  const {
    enabled: geoAutoUpdate,
    intervalHours: geoInterval,
    lastUpdatedAt: geoLastUpdated,
    setEnabled: setGeoAutoUpdate,
    setIntervalHours: setGeoInterval,
    triggerUpdate: triggerGeoUpdate,
  } = useGeoAutoUpdate();

  const onUpdateGeo = async () => {
    try {
      await triggerGeoUpdate();
      showNotice.success(
        "settings.feedback.notifications.clash.geoDataUpdated",
      );
    } catch (err: any) {
      showNotice.error(err);
    }
  };

  const handleDnsToggle = useLockFn(async (enable: boolean) => {
    try {
      setDnsSettingsEnabled(enable);
      localStorage.setItem("dns_settings_enabled", String(enable));
      await patchVerge({ enable_dns_settings: enable });
      await invoke("apply_dns_config", { apply: enable });
      setTimeout(() => {
        mutateClash();
      }, 500);
    } catch (err: any) {
      setDnsSettingsEnabled(!enable);
      localStorage.setItem("dns_settings_enabled", String(!enable));
      showNotice.error(err);
      await patchVerge({ enable_dns_settings: !enable }).catch(() => {});
      throw err;
    }
  });

  return (
    <SettingList title={t("settings.sections.clash.title")}>
      <ClashPortViewer ref={portRef} />
      <NetworkInterfaceViewer ref={networkRef} />
      <DnsViewer ref={dnsRef} />

      <SettingItem
        label={t("settings.sections.clash.form.fields.allowLan")}
        extra={
          <TooltipIcon
            title={t("settings.sections.clash.form.tooltips.networkInterface")}
            color={"inherit"}
            icon={LanRounded}
            onClick={() => {
              networkRef.current?.open();
            }}
          />
        }
      >
        <GuardState
          value={allowLan ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) => onChangeData({ "allow-lan": e })}
          onGuard={(e) => patchClash({ "allow-lan": e })}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>

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
          checked={dnsSettingsEnabled}
          onChange={(_, checked) => handleDnsToggle(checked)}
        />
      </SettingItem>

      <SettingItem label={t("settings.sections.clash.form.fields.ipv6")}>
        <GuardState
          value={ipv6 ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) => onChangeData({ ipv6: e })}
          onGuard={(e) => patchClash({ ipv6: e })}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>

      <SettingItem
        label={t("settings.sections.clash.form.fields.unifiedDelay")}
        extra={
          <TooltipIcon
            title={t("settings.sections.clash.form.tooltips.unifiedDelay")}
            sx={{ opacity: "0.7" }}
          />
        }
      >
        <GuardState
          value={unifiedDelay ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) => onChangeData({ "unified-delay": e })}
          onGuard={(e) => patchClash({ "unified-delay": e })}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>

      <SettingItem label={t("settings.sections.clash.form.fields.portConfig")}>
        <TextField
          autoComplete="new-password"
          disabled={false}
          size="small"
          value={verge_mixed_port ?? 7897}
          sx={{ width: 100, input: { py: "7.5px", cursor: "pointer" } }}
          onClick={(e) => {
            portRef.current?.open();
            (e.target as any).blur();
          }}
        />
      </SettingItem>

      <SettingItem
        onClick={onUpdateGeo}
        label={t("settings.sections.clash.form.fields.updateGeoData")}
        secondary={
          geoLastUpdated > 0
            ? `${t("settings.sections.clash.form.fields.geoDataLastUpdated")}: ${dayjs(geoLastUpdated).format("YYYY-MM-DD HH:mm")}`
            : t("settings.sections.clash.form.fields.geoDataNeverUpdated")
        }
      />

      <SettingItem
        label={t("settings.sections.clash.form.fields.autoUpdateGeoData")}
        extra={
          geoAutoUpdate ? (
            <Select
              size="small"
              value={geoInterval}
              onChange={(e) =>
                setGeoInterval(Number(e.target.value) as GeoIntervalHours)
              }
              onClick={(e) => e.stopPropagation()}
              sx={{ ml: 1, height: 28, fontSize: 12 }}
            >
              {GEO_INTERVAL_OPTIONS.map((h) => (
                <MenuItem key={h} value={h}>
                  {h}h
                </MenuItem>
              ))}
            </Select>
          ) : null
        }
      >
        <Switch
          checked={geoAutoUpdate}
          onChange={(_, v) => setGeoAutoUpdate(v)}
        />
      </SettingItem>

      <SettingItem
        label={t("settings.modals.misc.fields.autoCloseConnections")}
        extra={
          <TooltipIcon
            title={t("settings.modals.misc.tooltips.autoCloseConnections")}
            sx={{ opacity: "0.7" }}
          />
        }
      >
        <Switch
          edge="end"
          checked={verge?.auto_close_connection ?? true}
          onChange={(_, c) => {
            mutateVerge((v) => ({ ...v!, auto_close_connection: c }), false);
            patchVerge({ auto_close_connection: c }).catch(() => mutateVerge());
          }}
        />
      </SettingItem>

      <SettingItem label={t("settings.sections.clash.form.fields.clashCore")}>
        <Typography sx={{ py: "7px", pr: 1 }}>{version}</Typography>
      </SettingItem>
    </SettingList>
  );
};

export default SettingClash;
