// Super simple theme toggling with preferences cached in local storage.

const THEME_KEY = "preference-theme";
const THEME_CHANGE_ACTIVE = "theme-change-active";
const DARK = "dark";
const LIGHT = "light";
const THEMES = [DARK, LIGHT];

function themeFromLocalStorage() {
  const theme = localStorage.getItem(THEME_KEY);
  return THEMES.indexOf(theme) > 0 ? theme : DARK;
}

function toggleButtonState(theme, enabled) {
  const button = document.getElementById("theme-" + theme + "-button");
  enabled
    ? button.classList.add("enabled")
    : button.classList.remove("enabled");
  button.setAttribute("aria-pressed", !enabled);
}

function enableTheme(newTheme = DARK, withTransition = false, save = true) {
  const root = document.documentElement;
  const otherTheme = newTheme === LIGHT ? DARK : LIGHT;
  const currentTheme = root.classList.contains("theme-" + DARK) ? DARK : LIGHT;

  if (withTransition && newTheme !== currentTheme) {
    animateThemeTransition();
  }

  root.classList.add("theme-" + newTheme);
  root.classList.remove("theme-" + otherTheme);

  toggleButtonState(otherTheme, true);
  toggleButtonState(newTheme, false);

  if (save) {
    localStorage.setItem(THEME_KEY, newTheme);
  }
}

function animateThemeTransition() {
  const root = document.documentElement;
  root.classList.remove(THEME_CHANGE_ACTIVE);
  void root.offsetWidth; // Trigger reflow to cancel the animation
  root.classList.add(THEME_CHANGE_ACTIVE);
}

function supportedAnimationEvent() {
  const el = document.createElement("f");
  const animations = {
    animation: "animationend",
    OAnimation: "oAnimationEnd",
    MozAnimation: "animationend",
    WebkitAnimation: "webkitAnimationEnd",
  };

  // Return the name of the event fired by the browser to indicate a CSS animation has ended
  for (t in animations) {
    if (el.style[t] !== undefined) return animations[t];
  }
}

function syncBetweenTabs() {
  window.addEventListener("storage", e => {
    if (e.key === THEME_KEY) {
      enableTheme(e.newValue, false);
    }
  });
}

// Register the listeners and initialize the theme
(function initializeTheme() {
  syncBetweenTabs();
  enableTheme(themeFromLocalStorage(), false);
})();

(function removeAnimationClass() {
  const root = document.documentElement;
  root.addEventListener(
    supportedAnimationEvent(),
    () => root.classList.remove(THEME_CHANGE_ACTIVE),
    false,
  );
})();
