// The shared menu replaces the visible page while open. No second dialog,
// portal or browser window is created, and the lower navigation stays usable.
const VISIBILITY_EVENT = "jagdlatein-menu-visibility";

export function setSingleMenuOpen(menu, open) {
  if (!menu) return false;
  menu.open = open;
  // A following content-focus operation must not run while its page is still
  // inert. Native toggle/MutationObserver delivery alone would be too late.
  const Event = menu.ownerDocument?.defaultView?.Event;
  if (Event) menu.dispatchEvent(new Event(VISIBILITY_EVENT));
  return true;
}

export function installSingleViewNavigation(navigation, menu) {
  const document = navigation?.ownerDocument;
  const window = document?.defaultView;
  if (!document?.body || !menu?.addEventListener || !window) return () => {};
  const hidden = new Map();
  let locked = null;
  let opened = false;
  let disposed = false;
  const summary = menu.querySelector("summary");
  const originalLabel = summary?.getAttribute("aria-label");
  function restoreAttribute(element, name, previous, assigned) {
    if (element.getAttribute(name) !== assigned) return;
    if (previous === null) element.removeAttribute(name); else element.setAttribute(name, previous);
  }
  function restoreStyle(element, name, previous, assigned) {
    if (element.style.getPropertyValue(name) !== assigned || element.style.getPropertyPriority(name) !== "important") return;
    if (previous.value) element.style.setProperty(name, previous.value, previous.priority); else element.style.removeProperty(name);
  }
  function style(element, name, value) {
    const previous = { value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) };
    element.style.setProperty(name, value, "important");
    return previous;
  }
  function release() {
    for (const [element, previous] of hidden) {
      restoreAttribute(element, "inert", previous.inert, "");
      restoreAttribute(element, "aria-hidden", previous.ariaHidden, "true");
      restoreStyle(element, "opacity", previous.opacity, "0");
    }
    hidden.clear();
    if (locked) {
      restoreStyle(document.body, "overflow", locked.body, "hidden");
      restoreStyle(document.documentElement, "overflow", locked.html, "hidden");
      locked = null;
    }
    navigation.removeAttribute("data-single-menu-view");
    if (summary) restoreAttribute(summary, "aria-label", originalLabel, "Menü schließen");
    opened = false;
  }
  function conceal(element) {
    if (hidden.has(element) || ["SCRIPT", "STYLE", "LINK"].includes(element.tagName)) return;
    hidden.set(element, { inert: element.getAttribute("inert"), ariaHidden: element.getAttribute("aria-hidden"), opacity: style(element, "opacity", "0") });
    element.setAttribute("inert", "");
    element.setAttribute("aria-hidden", "true");
  }
  function sync() {
    if (disposed) return;
    if (!menu.open) {
      const field = document.activeElement;
      release();
      if (field !== summary && menu.contains(field)) summary?.focus({ preventScroll: true });
      return;
    }
    if (!locked) locked = { body: style(document.body, "overflow", "hidden"), html: style(document.documentElement, "overflow", "hidden") };
    if (!opened) {
      opened = true;
      const panel = menu.querySelector("[data-navigation-view]");
      if (panel) panel.scrollTop = 0;
    }
    navigation.setAttribute("data-single-menu-view", "");
    summary?.setAttribute("aria-label", "Menü schließen");
    // Hide only siblings outside the navigation's ancestor branch. This works
    // with both app shells and leaves the original PageMenu outlet in place.
    let branch = navigation;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of parent.children) if (sibling !== branch) conceal(sibling);
      if (parent === document.body) break;
      branch = parent;
    }
  }
  function focusable(element) {
    if (element.tabIndex < 0 || element.matches(":disabled") || element.closest("[hidden], [inert], [aria-hidden='true']")) return false;
    const visibility = window.getComputedStyle(element).visibility;
    if (visibility === "hidden" || visibility === "collapse") return false;
    for (let current = element; current; current = current.parentElement) {
      const computed = window.getComputedStyle(current);
      if (computed.display === "none" || computed.contentVisibility === "hidden") return false;
      if (current === navigation) break;
    }
    let disclosure = element.closest("details");
    while (disclosure) {
      if (!disclosure.open && !disclosure.querySelector("summary")?.contains(element)) return false;
      disclosure = disclosure.parentElement?.closest("details");
    }
    return true;
  }
  function keydown(event) {
    if (!menu.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      menu.open = false;
      release();
      summary?.focus({ preventScroll: true });
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...navigation.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]")].filter(focusable);
    if (!controls.length) return;
    const active = document.activeElement;
    const index = controls.indexOf(active);
    if (index < 0 || (!event.shiftKey && index === controls.length - 1) || (event.shiftKey && index === 0)) {
      event.preventDefault();
      (event.shiftKey ? controls[controls.length - 1] : controls[0]).focus({ preventScroll: true });
    }
  }
  const beforePrint = () => { setSingleMenuOpen(menu, false); };
  const Observer = window.MutationObserver;
  const observer = typeof Observer === "function" ? new Observer(sync) : null;
  observer?.observe(menu, { attributes: true, attributeFilter: ["open"] });
  observer?.observe(document.body, { childList: true, subtree: true });
  menu.addEventListener("toggle", sync);
  menu.addEventListener(VISIBILITY_EVENT, sync);
  document.addEventListener("keydown", keydown);
  window.addEventListener("beforeprint", beforePrint);
  sync();
  return () => {
    disposed = true;
    observer?.disconnect();
    menu.removeEventListener("toggle", sync);
    menu.removeEventListener(VISIBILITY_EVENT, sync);
    document.removeEventListener("keydown", keydown);
    window.removeEventListener("beforeprint", beforePrint);
    release();
  };
}
