import { atom } from "jotai";
import { atomWithLocation } from "jotai-location";
import LZString from "lz-string";
import { shallowEqual } from "../utils/shallowEqual";
import { selectAtom } from "jotai/utils";
import { fixedEncodeURIComponent, lookupUrl } from "../utils/uri";
import { atomWithQuery } from "jotai-tanstack-query";

/* IMPORTANT:
 * Most of the functionality in this file must exactly match the Live Lean
 * app's behavior for cross-site switching to work.
 */

type HashArgs = { [key: string]: string | null };

/**
 * Format the arguments for displaying in the URL, i.e. join them
 * in the form `#project=Mathlib&url=...`
 */
export function formatArgs(args: HashArgs): string {
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
export function parseArgs(hash: string): { [key: string]: string } {
  return Object.fromEntries(
    hash
      .replace("#", "")
      .split("&")
      .map<[string, string] | null>((s, i) => {
        const [key, value, ...rest] = s.split("=");
        if (!key || !value || rest.length > 0) {
          console.error(`Ignoring ill-formed URL arg #{i+1}: ${s}`);
          return null;
        }
        return [key, value];
      })
      .filter((x): x is [string, string] => x !== null),
  );
}

/**
 * Atom containing the key/value pairs in
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

/** Remember the last-entered url */
export const originalChallengeUrlAtom = atom<string>();
export const originalSolutionUrl = atom<string>();

/** Sync the url with the hash */
export const challengeUrlAtom = atom(
  (get) => {
    return get(hashArgsAtom).challengeUrl ?? get(originalChallengeUrlAtom);
  },
  (get, set, challengeUrl: string) => {
    const hashArgs = get(hashArgsAtom);
    if (hashArgs.challengeUrl === challengeUrl) return;
    set(originalChallengeUrlAtom, challengeUrl);
    set(hashArgsAtom, { ...hashArgs, challengeUrl, challenge: null, challengez: null });
  },
);
export const solutionUrlAtom = atom(
  (get) => {
    return get(hashArgsAtom).solutionUrl ?? get(originalSolutionUrl);
  },
  (get, set, url: string) => {
    const hashArgs = get(hashArgsAtom);
    if (hashArgs.url === url) return;
    set(originalSolutionUrl, url);
    set(hashArgsAtom, { ...hashArgs, url, code: null, codez: null });
  },
);

/** Query for imported code using tanstack */
export const challengeQueryAtom = atomWithQuery((get) => {
  const url = get(challengeUrlAtom);
  return {
    queryKey: ["importedChallenge", url],
    queryFn: async () => {
      if (!url) return undefined;
      const res = await fetch(lookupUrl(url));
      const code = res.ok ? res.text() : `Error: failed to load code from ${url}`;
      return code;
    },
  };
});
export const solutionQueryAtom = atomWithQuery((get) => {
  const url = get(solutionUrlAtom);
  return {
    queryKey: ["importedSolution", url],
    queryFn: async () => {
      if (!url) return undefined;
      const res = await fetch(lookupUrl(url));
      const code = res.ok ? res.text() : `Error: failed to load code from ${url}`;
      return code;
    },
  };
});

/** Synchronize code with the hash */
export const challengeAtom = atom(
  (get) => {
    const hashArgs = get(hashArgsAtom);
    if (hashArgs.url) {
      return get(challengeQueryAtom).data;
    } else if (hashArgs.challenge) {
      return hashArgs.challenge;
    } else if (hashArgs.challengez) {
      return LZString.decompressFromBase64(hashArgs.challengez);
    } else {
      return "";
    }
  },
  (get, set, code: string) => {
    const hashArgs = get(hashArgsAtom);
    if (
      code.length === 0 &&
      ("challengeUrl" in hashArgs || "challenge" in hashArgs || "challengez" in hashArgs)
    ) {
      set(hashArgsAtom, { ...hashArgs, challengeUrl: null, challenge: null, challengez: null });
      return;
    }

    const importUrl = get(originalChallengeUrlAtom);
    const importedCode = get(challengeQueryAtom);
    if (code === importedCode.data) {
      if (importUrl === hashArgs.challengeUrl) return;
    }

  },
);

/**
 * Jotai's mechanism for syncing with the URL. We'll interact with this
 * through urlArgsAtom
 */
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
