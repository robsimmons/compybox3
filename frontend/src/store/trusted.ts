import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import trustedJson from "../../../trusted.json";
import { challengeAtom } from "./params";

const CHALLENGE_HASH_MS_DEBOUNCE = 2000;

/**
 * SHA-256 hashes the challenge (end-trimmed with a trailing newline
 * re-inserted).
 *
 * Uses promises and cancellation to debounce. The debounce is less about
 * avoiding useless hashes, and more about making the delay before showing a
 * challenge result look intentional instead of like an unpleasant flicker.
 */
export const challengeHashAtom = atom(async (get, { signal }) => {
  const challenge = get(challengeAtom);
  await new Promise((resolve) => setTimeout(resolve, CHALLENGE_HASH_MS_DEBOUNCE));
  signal.throwIfAborted();

  const encoder = new TextEncoder();
  const data = encoder.encode(challenge.trimEnd() + "\n");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b: number): string => b.toString(16)).join("");
});

export const storeTrustedAtom = atomWithStorage<[string, string][]>(
  "locallyTrusted",
  [],
  undefined,
  { getOnInit: true },
);
export const locallyTrustedAtom = atom(
  (get) => {
    const stored = get(storeTrustedAtom);
    return Object.fromEntries(stored);
  },
  (get, set, trusted: { [hash: string]: string }) => {
    const keys = Object.keys(trusted);
    set(
      storeTrustedAtom,
      keys.map((key) => [key, trusted[key]!]),
    );
  },
);

const builtInTrusted: {
  [key: string]: {
    name: string;
    sources: string[];
  };
} = trustedJson;

type TrustRecognition =
  | { type: "built-in"; name: string; sources: string[] }
  | { type: "user"; name: string }
  | { type: "none" };

/**
 * Do we recognize this challenge as one of our trusted challenges, or one of
 * the user's trusted challenges?
 */
export const recognitionAtom = atom<Promise<TrustRecognition>>(async (get) => {
  const challengeHash = await get(challengeHashAtom);

  const builtInTrust = builtInTrusted[challengeHash];
  if (builtInTrust) return { type: "built-in", ...builtInTrust };

  const locallyTrusted = get(locallyTrustedAtom)[challengeHash];
  if (locallyTrusted) return { type: "user", name: locallyTrusted };

  return { type: "none" };
});
