export const OFFICIAL_FLAVORS = Object.freeze(['hardline', 'soft', 'rivet', 'mono', 'pulse']);

/**
 * Observe an actual published Flavor document through the browser.
 * The evaluated function receives its Flavor explicitly; browser contexts
 * cannot capture values from Node closures.
 */
export async function inspectFlavorPage(page, baseOrigin, flavor) {
  if (!OFFICIAL_FLAVORS.includes(flavor)) throw new Error('Unrecognized Flavor ' + flavor);
  const url = new URL('/flavors/' + flavor + '/', baseOrigin).href;
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const details = await page.locator('main').first().evaluate((element, expectedFlavor) => ({
    light: element.classList.contains('ns-theme-' + expectedFlavor + '-light'),
    dark: Boolean(element.querySelector('.ns-theme-' + expectedFlavor + '-dark')),
    title: element.querySelector('h1')?.textContent?.trim() || null
  }), flavor);
  return {
    url,
    httpStatus: response?.status() ?? 0,
    found: response?.status() === 200 && details.light && details.dark &&
      details.title === flavor.charAt(0).toUpperCase() + flavor.slice(1) + ' Light',
    light: details.light,
    dark: details.dark,
    title: details.title
  };
}
