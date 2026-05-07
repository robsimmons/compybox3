import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import trustedJson from "../../../trusted.json";
import { challengeAtom } from "./params";

export const challengeHashAtom = atom(async (get) => {
  const challenge = get(challengeAtom);
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

export interface TrustedChallenge {
  name: string;
  sources: string[];
}
const builtInTrusted: { [key: string]: { name: string; sources: string[] } } = trustedJson;

/**
 * Do we recognize this challenge as one of our trusted challenges, or one of
 * the user's trusted challenges?
 *
 * Imposes an artificial delay delay so that the tiny delay involved in
 * computing a SHA-256 hash doesn't cause screen flicker.
 */
export const recognitionAtom = atom(async (get) => {
  const challengeHash = await get(challengeHashAtom);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const builtInTrust = builtInTrusted[challengeHash];
  if (builtInTrust) return builtInTrust;

  const locallyTrusted = get(locallyTrustedAtom)[challengeHash];
  if (locallyTrusted) return { name: locallyTrusted };

  return null;
});
