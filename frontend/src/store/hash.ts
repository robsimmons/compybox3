import { atom } from "jotai";
import { atomWithLocation } from "jotai-location";

import { fixedEncodeURIComponent } from "../utils/uri.ts";

/**
 * Manage the hash params in a custom way; we slightly differ from the default
 * behavior that jotai-location's `atomWithHash` uses.
 *
 * IMPORTANT:
 * Most of the functionality in this file must exactly match the Live Lean
 * app's behavior for cross-site switching to work.
 */

export type HashArgs = { [key: string]: string | null };

/**
 * Format the arguments for displaying in the URL, i.e. join them
 * in the form `#project=Mathlib&url=...`
 */
function formatArgs(args: HashArgs): string {
  const out =
    "#" +
    Object.entries(args)
      .filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].trim().length > 0,
      )
      .map(([key, val]) => `${key}=${fixedEncodeURIComponent(val)}`)
      .join("&");
  if (out === "#") {
    return "";
  }
  return out;
}

/**
 * Parse arguments from URL. These are of the form `#project=Mathlib&url=...`,
 * where the leading hash is optional
 */
function parseArgs(hash: string): { [key: string]: string } {
  if (hash === "") return {};
  return Object.fromEntries(
    hash
      .replace("#", "")
      .split("&")
      .map<[string, string] | null>((s, i) => {
        const [key, value, ...rest] = s.split("=");
        if (!key || !value || rest.length > 0) {
          console.error(`Ignoring ill-formed URL arg ${i + 1}: ${s}`);
          return null;
        }
        return [key, decodeURIComponent(value)];
      })
      .filter((x): x is [string, string] => x !== null),
  );
}

/**
 * Jotai's mechanism for syncing with the URL. We'll interact with this
 * entirely through hashArgsAtom
 */
const locationAtom = atomWithLocation();

/**
 * Atom containing the key/value pairs in the hash. The functions in
 * ./params.ts will set this atom, other parts of the app should only read.
 */
export const hashArgsAtom = atom(
  (get) => {
    const hash = get(locationAtom).hash ?? "";
    return parseArgs(hash);
  },
  (get, set, val: HashArgs) => {
    const hash = formatArgs(val);
    const location = get(locationAtom);
    set(locationAtom, { ...location, hash });
  },
);
