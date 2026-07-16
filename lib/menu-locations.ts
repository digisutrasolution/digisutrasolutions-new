/* Client-safe menu-location registry (no server imports — the admin UI and
   lib/menu both consume this). Footer columns: top-level items are column
   headings, children are links. Footer legal: flat link list. */
export const MENU_LOCATIONS = [
  { key: "HEADER", label: "Header" },
  { key: "FOOTER", label: "Footer columns" },
  { key: "FOOTER_LEGAL", label: "Footer legal bar" },
] as const;

export type MenuLocation = (typeof MENU_LOCATIONS)[number]["key"];
