/**
 * Applies the saved theme before first paint.
 *
 * This has to be an inline script in <head>, not an effect in a component: an
 * effect runs after the browser has already painted the page, which is exactly
 * the white flash a dark-mode reader notices. It also sets the color scheme so
 * form controls and scrollbars follow.
 */
export function ThemeScript() {
  const script = `(function(){try{
    var saved = localStorage.getItem('hard-theme');
    var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = saved ? saved === 'dark' : prefers;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
