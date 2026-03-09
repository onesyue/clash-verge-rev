import React from "react";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";

import { Switch } from "@/components/base";
import ProxyControlSwitches from "@/components/shared/proxy-control-switches";
import { useVerge } from "@/hooks/use-verge";

import { GuardState } from "./mods/guard-state";
import { SettingList, SettingItem } from "./mods/setting-comp";

interface Props {
  onError?: (err: Error) => void;
}

const SettingSystem = ({ onError }: Props) => {
  const { t } = useTranslation();

  const { verge, mutateVerge, patchVerge } = useVerge();

  const { enable_auto_launch } = verge ?? {};

  const onSwitchFormat = (
    _e: React.ChangeEvent<HTMLInputElement>,
    value: boolean,
  ) => value;
  const onChangeData = (patch: Partial<IVergeConfig>) => {
    mutateVerge({ ...verge, ...patch }, false);
  };

  return (
    <SettingList title={t("settings.sections.system.title")}>
      <ProxyControlSwitches
        label={t("settings.sections.system.toggles.tunMode")}
        onError={onError}
      />

      <ProxyControlSwitches
        label={t("settings.sections.system.toggles.systemProxy")}
        onError={onError}
      />

      <SettingItem label={t("settings.sections.system.fields.autoLaunch")}>
        <GuardState
          value={enable_auto_launch ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) => {
            onChangeData({ enable_auto_launch: e });
          }}
          onGuard={async (e) => {
            try {
              onChangeData({ enable_auto_launch: e });
              await patchVerge({ enable_auto_launch: e });
              await mutate("getAutoLaunchStatus");
              return Promise.resolve();
            } catch (error) {
              onChangeData({ enable_auto_launch: !e });
              return Promise.reject(error);
            }
          }}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>
    </SettingList>
  );
};

export default SettingSystem;
