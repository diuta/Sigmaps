export type PropertyPopupStyle = "sleek" | "slender-detail" | "vertical-card";

export interface PropertyPopupConfigContextValue {
  popupStyle: PropertyPopupStyle;
  setPopupStyle: (style: PropertyPopupStyle) => void;
  themeMode: "light" | "dark";
  setThemeMode: (theme: "light" | "dark") => void;
}
