/* Desktop alerts that do not go through a push service.

   Web Push needs Chrome's own GCM machinery, and on some profiles that is
   simply unavailable — subscribe() fails with PUBLIC_KEY_UNAVAILABLE no matter
   how many times the service worker is rebuilt. Nothing in this app can fix
   that. What still works everywhere is the plain Notification constructor: as
   long as the CMS tab is open and the permission is granted, the notification
   poll can raise a real desktop notification itself.

   So this is the fallback tier — background delivery is lost, but a lead that
   arrives while someone has the CMS open still pops on their desktop. */

export const TAB_ALERTS_KEY = "ds.tabAlerts";

export function tabAlertsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TAB_ALERTS_KEY) === "1";
  } catch {
    // Storage can throw in hardened/private profiles — treat it as off.
    return false;
  }
}

export function setTabAlerts(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(TAB_ALERTS_KEY, "1");
    else window.localStorage.removeItem(TAB_ALERTS_KEY);
  } catch {
    /* nothing we can do; the toggle just will not persist */
  }
}

export function canRaiseTabAlert(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    tabAlertsEnabled()
  );
}
