import { List, ListItem, ListItemText, MenuItem, Select } from "@mui/material";
import { useLockFn } from "ahooks";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch, TooltipIcon } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/notice-service";

export const MiscViewer = forwardRef<DialogRef>((props, ref) => {
  const { t } = useTranslation();
  const { verge, patchVerge } = useVerge();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    autoCloseConnection: true,
    proxyLayoutColumn: 6,
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setValues({
        autoCloseConnection: verge?.auto_close_connection ?? true,
        proxyLayoutColumn: verge?.proxy_layout_column || 6,
      });
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    try {
      await patchVerge({
        auto_close_connection: values.autoCloseConnection,
        proxy_layout_column: values.proxyLayoutColumn,
      });
      setOpen(false);
    } catch (err) {
      showNotice.error(err);
    }
  });

  return (
    <BaseDialog
      open={open}
      title={t("settings.modals.misc.title")}
      contentSx={{ width: 450 }}
      okBtn={t("shared.actions.save")}
      cancelBtn={t("shared.actions.cancel")}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      onOk={onSave}
    >
      <List>
        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText
            primary={t("settings.modals.misc.fields.autoCloseConnections")}
            sx={{ maxWidth: "fit-content" }}
          />
          <TooltipIcon
            title={t("settings.modals.misc.tooltips.autoCloseConnections")}
            sx={{ opacity: "0.7" }}
          />
          <Switch
            edge="end"
            checked={values.autoCloseConnection}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, autoCloseConnection: c }))
            }
            sx={{ marginLeft: "auto" }}
          />
        </ListItem>

        <ListItem sx={{ padding: "5px 2px" }}>
          <ListItemText
            primary={t("settings.modals.misc.fields.proxyLayoutColumns")}
          />
          <Select
            size="small"
            sx={{ width: 160, "> div": { py: "7.5px" } }}
            value={values.proxyLayoutColumn}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                proxyLayoutColumn: e.target.value as number,
              }))
            }
          >
            <MenuItem value={6} key={6}>
              {t("settings.modals.misc.options.proxyLayoutColumns.auto")}
            </MenuItem>
            {[1, 2, 3, 4, 5].map((i) => (
              <MenuItem value={i} key={i}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </ListItem>
      </List>
    </BaseDialog>
  );
});
