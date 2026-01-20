import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Menu, MenuItem, Tooltip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  // Determine current language label
  const currentLang = i18n.language;

  return (
    <>
      <Tooltip title={t("components.language_switcher.label")}>
        <Button
          color="inherit"
          id="language-button"
          aria-controls={open ? "language-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          startIcon={<TranslateIcon />}
        >
          {currentLang.startsWith("pt") ? "PT" : "EN"}
        </Button>
      </Tooltip>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "language-button",
        }}
      >
        <MenuItem
          onClick={() => changeLanguage("pt-BR")}
          selected={currentLang.startsWith("pt")}
        >
          Português (BR)
        </MenuItem>
        <MenuItem
          onClick={() => changeLanguage("en")}
          selected={currentLang.startsWith("en")}
        >
          English
        </MenuItem>
      </Menu>
    </>
  );
};
