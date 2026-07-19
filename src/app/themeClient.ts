import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from "./theme";

const THEME_CHANGE_EVENT = "mathgame:theme-change";

export function isDocumentUsingLightTheme() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("theme-light")
  );
}

function applyDocumentTheme(isLightTheme: boolean) {
  const root = document.documentElement;
  root.classList.toggle("theme-light", isLightTheme);
  root.classList.toggle("theme-dark", !isLightTheme);
  root.dataset.theme = isLightTheme ? LIGHT_THEME : DARK_THEME;
}

export function setLightTheme(isLightTheme: boolean) {
  applyDocumentTheme(isLightTheme);

  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      isLightTheme ? LIGHT_THEME : DARK_THEME,
    );
  } catch {
    // The theme still changes for this visit when storage is unavailable.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeToTheme(onThemeChange: () => void) {
  const syncThemeFromStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;

    applyDocumentTheme(event.newValue === LIGHT_THEME);
    onThemeChange();
  };

  window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
  window.addEventListener("storage", syncThemeFromStorage);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.removeEventListener("storage", syncThemeFromStorage);
  };
}
