import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useVerge } from "@/hooks/use-verge";
import { supportedLanguages } from "@/services/i18n";

import { GuardState } from "./mods/guard-state";
import { SettingItem, SettingList } from "./mods/setting-comp";
import { ThemeModeSwitch } from "./mods/theme-mode-switch";

interface Props {
  onError?: (err: Error) => void;
}

const languageOptions = supportedLanguages.map((code) => {
  const labels: { [key: string]: string } = {
    en: "English",
    ru: "Русский",
    zh: "中文",
    fa: "فارسی",
    tt: "Татар",
    id: "Bahasa Indonesia",
    ar: "العربية",
    ko: "한국어",
    tr: "Türkçe",
    de: "Deutsch",
    es: "Español",
    jp: "日本語",
    zhtw: "繁體中文",
  };
  const label = labels[code] || code;
  return { code, label };
});

const SettingVergeBasic = ({ onError }: Props) => {
  const { t } = useTranslation();

  const { verge, patchVerge, mutateVerge } = useVerge();
  const { theme_mode, language } = verge ?? {};

  const onChangeData = (patch: any) => {
    mutateVerge({ ...verge, ...patch }, false);
  };

  return (
    <SettingList title={t("settings.components.verge.basic.title")}>
      <SettingItem label={t("settings.components.verge.basic.fields.language")}>
        <GuardState
          value={language ?? "en"}
          onCatch={onError}
          onFormat={(e: any) => e.target.value}
          onChange={(e) => onChangeData({ language: e })}
          onGuard={(e) => patchVerge({ language: e })}
        >
          <Select size="small" sx={{ width: 110, "> div": { py: "7.5px" } }}>
            {languageOptions.map(({ code, label }) => (
              <MenuItem key={code} value={code}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </GuardState>
      </SettingItem>

      <SettingItem
        label={t("settings.components.verge.basic.fields.themeMode")}
      >
        <GuardState
          value={theme_mode}
          onCatch={onError}
          onChange={(e) => onChangeData({ theme_mode: e })}
          onGuard={(e) => patchVerge({ theme_mode: e })}
        >
          <ThemeModeSwitch />
        </GuardState>
      </SettingItem>
    </SettingList>
  );
};

export default SettingVergeBasic;
