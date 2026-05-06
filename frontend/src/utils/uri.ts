/**
 * Escape more characters in URL
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_rfc3986
 */
export function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}


/**
 * Tries to lookup and replace some common URLs, such as a github url. Must
 * do exactly what Live Lean app does.
 *
 * - change link to github file to its raw content.
 */
export function lookupUrl(url: string): string {
  const regex = RegExp('https://github.com/(.+)/blob/(.+)')

  if (regex.test(url)) {
    url = url.replace(regex, 'https://raw.githubusercontent.com/$1/refs/heads/$2')
  }

  return url
}
