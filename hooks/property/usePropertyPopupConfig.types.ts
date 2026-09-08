export type PropertyPopupStyle = "sleek" | "slender-detail" | "vertical-card" | "vertical-card-v2";

export interface PropertyPopupConfigContextValue {
  popupStyle: PropertyPopupStyle;
  setPopupStyle: (style: PropertyPopupStyle) => void;
  themeMode: "light" | "dark";
  setThemeMode: (theme: "light" | "dark") => void;
}
