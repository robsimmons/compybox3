import { atom } from "jotai";
import { atomWithLocation } from "jotai-location";
import LZString from "lz-string";

/* IMPORTANT:
 * Most of the functionality in this file must exactly match the Live Lean
 * app's behavior for cross-site switching to work
 */

const URL_ARG_KEYS = [
  "project",
  "url",
  "code",
  "codez",
  "challenge",
  "challengez",
  "challengeurl",
] as const;
type UrlArgKey = (typeof URL_ARG_KEYS)[number];
export type UrlArgs = { [key in UrlArgKey]?: string };
function isUrlArgKey(key: string): key is UrlArgKey {
  return (URL_ARG_KEYS as readonly string[]).includes(key);
}

/**
 * Format the arguments for displaying in the URL, i.e. join them
 * in the form `#project=Mathlib&url=...`
 */
export function formatArgs(args: UrlArgs): string {
  const out =
    "#" +
    Object.entries(args)
      .filter(([_key, val]) => typeof val === "string" && val.trim().length > 0)
      .map(([key, val]) => `${key}=${decodeURIComponent(val)}`)
      .join("&");
  if (out === "#") {
    return " ";
  }
  return out;
}

/**
 * Parse arguments from URL. These are of the form `#project=Mathlib&url=...`
 */
export function parseArgs(hash: string): UrlArgs {
  return Object.fromEntries(
    hash
      .replace("#", "")
      .split("&")
      .map<[UrlArgKey, string] | null>((s) => {
        const [key, value, ...rest] = s.split("=");
        if (!key || !isUrlArgKey(key) || !value || rest.length > 0) {
          console.error(`Ignoring ill-formed URL arg ${key}`);
          return null;
        }
        return [key, value];
      })
      .filter((x): x is [UrlArgKey, string] => x !== null),
  );
}

export const locationAtom = atomWithLocation();

/**
 * The parameters which are provided in the url hash, i.e. after the `#`.
 */
export const urlArgsAtom = atom<UrlArgs, [UrlArgs], void>(
  (get) => {
    const hash = get(locationAtom).hash;
    if (hash === undefined) return {};
    return parseArgs(hash);
  },
  (get, set, val: UrlArgs) => {
    const hash = formatArgs(val);
    const location = get(locationAtom);
    set(locationAtom, { ...location, hash: hash });
  },
);

/**
 * Escape `(` and `)` in URL.
 * Must exactly match the corresponding behavior in the Live Lean app
 */
export function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(/[()]/g, function (c) {
    return "%" + c.charCodeAt(0).toString(16);
  });
}

/** Atom which represents the editor content and synchronises it with the url hash.
export const codeAtom = atom(
  (get) => {
    const urlArgs = get(urlArgsStableAtom);
    if (urlArgs.url) {
      return get(importedCodeAtom);
    } else if (urlArgs.code) {
      return urlArgs.code;
    }
    if (urlArgs.codez) {
      return LZString.decompressFromBase64(urlArgs.codez);
    } else {
      return "";
    }
  },
  (get, set, code: string) => {
    const urlArgs = get(urlArgsAtom);
    if (urlArgs.url) {
      // store the import URL so we can display it later again
      set(importUrlBaseAtom, urlArgs.url);
    }
    if (code.length == 0) {
      // delete all url arguments if there is no code
      set(urlArgsAtom, { ...urlArgs, url: undefined, code: undefined, codez: undefined });
      return;
    }
    const importedCode = get(importedCodeAtom);
    const url = get(importUrlAtom) ?? "";
    if (code == importedCode) {
      set(urlArgsAtom, {
        ...urlArgs,
        url: fixedEncodeURIComponent(url),
        code: undefined,
        codez: undefined,
      });
    } else if (get(settingsAtom).compress) {
      // LZ padds the string with trailing `=`, which mess up the argument parsing
      // and aren't needed for LZ encoding, so we remove them.
      const compressedCode = LZString.compressToBase64(code).replace(/=*$/, "");
      set(urlArgsAtom, {
        ...urlArgs,
        url: undefined,
        code: undefined,
        codez: fixedEncodeURIComponent(compressedCode),
      });
    } else {
      const encodedCode = fixedEncodeURIComponent(code);
      set(urlArgsAtom, { ...urlArgs, url: undefined, code: encodedCode, codez: undefined });
    }
  },
);
 */
