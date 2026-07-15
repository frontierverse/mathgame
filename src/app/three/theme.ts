export const FONT_REGULAR = "/fonts/MalgunGothic.ttf";
export const FONT_BOLD = "/fonts/MalgunGothic-Bold.ttf";

export const palette = {
  backdrop: "#fff7ea",
  stageBg: "#e9e0ff",
  stageBgShadow: "#d8cff0",
  cardBg: "#ffffff",
  cardShadow: "#ded9ec",
  panelBg: "#f7f4ff",
  panelBgAlt: "#efe8ff",
  ink: "#3d285f",
  inkSoft: "#6a5a82",
  inkFaint: "#9f9278",
  purple: "#9f70eb",
  purpleDeep: "#6644a8",
  purpleText: "#7c5cd6",
  purpleTextDeep: "#6f4ab4",
  orange: "#ffb23f",
  orangeShadow: "#b97718",
  orangeText: "#d57920",
  red: "#ff5963",
  redShadow: "#a62f38",
  redText: "#d5486d",
  blue: "#4f8df7",
  blueShadow: "#2f5fb7",
  green: "#39b567",
  greenShadow: "#257a45",
  greenText: "#2e9155",
  yellow: "#ffca3a",
  yellowShadow: "#a98212",
  yellowSolid: "#f4d03f",
  pink: "#f56fd2",
  pinkShadow: "#aa3c91",
  pinkDeep: "#d65fd2",
  teal: "#22bfd4",
  tealShadow: "#147d8d",
  wood: "#8b5a2b",
  woodLight: "#a06a35",
} as const;

export const layout = {
  virtualWidth: 17.2,
  virtualHeight: 9.6,
  top: 4.55,
  bottom: -4.55,
  stageLeft: -8.3,
  stageRight: 2.1,
  sidebarLeft: 2.75,
  sidebarRight: 8.3,
} as const;

export const numberKeyColors = [
  { color: palette.blue, shadow: palette.blueShadow, text: "#ffffff" },
  { color: palette.red, shadow: palette.redShadow, text: "#ffffff" },
  { color: palette.green, shadow: palette.greenShadow, text: "#ffffff" },
  { color: palette.orange, shadow: palette.orangeShadow, text: palette.ink },
  { color: palette.purple, shadow: palette.purpleDeep, text: "#ffffff" },
  { color: palette.teal, shadow: palette.tealShadow, text: "#ffffff" },
  { color: palette.pink, shadow: palette.pinkShadow, text: "#ffffff" },
  { color: "#ff7a7a", shadow: "#bd4848", text: "#ffffff" },
  { color: palette.yellowSolid, shadow: "#a88b16", text: palette.ink },
  { color: palette.purple, shadow: palette.purpleDeep, text: "#ffffff" },
];

export const operatorKeyColors = [
  { color: palette.red, shadow: palette.redShadow, text: "#ffffff" },
  { color: palette.blue, shadow: palette.blueShadow, text: "#ffffff" },
  { color: palette.green, shadow: palette.greenShadow, text: "#ffffff" },
  { color: palette.yellow, shadow: palette.yellowShadow, text: palette.ink },
  { color: palette.pinkDeep, shadow: "#8f378d", text: "#ffffff" },
  { color: palette.teal, shadow: palette.tealShadow, text: "#ffffff" },
];
