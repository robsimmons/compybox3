import { produce } from "immer";
import { atom } from "jotai";
import LZString from "lz-string";

import { toLZCompressedString } from "../utils/compress";
import { type HashArgs, hashArgsAtom } from "./hash";

function codeAtom(urlKey: string, plainTextKey: string, compressedKey: string) {
  return atom(
    (get) => {
      const hashArgs = get(hashArgsAtom);
      if (hashArgs[urlKey]) {
        return `Import from the url like ${hashArgs[urlKey]} not currently supported`;
      }
      if (hashArgs[plainTextKey]) {
        return hashArgs[plainTextKey];
      } else if (hashArgs[compressedKey]) {
        return LZString.decompressFromBase64(hashArgs[compressedKey]);
      } else {
        return "";
      }
    },
    (get, set, code: string) => {
      const hashArgs = get(hashArgsAtom);
      const compressed = code.length === 0 ? null : toLZCompressedString(code);
      set(
        hashArgsAtom,
        produce(hashArgs, (draft: HashArgs) => {
          draft[urlKey] = null;
          draft[plainTextKey] = null;
          draft[compressedKey] = compressed;
        }),
      );
    },
  );
}

/**
 * Synchronize challenge code with the hash
 */
export const challengeAtom = codeAtom("challengeUrl", "challenge", "challengez");

/**
 * Synchronize solution code with the hash
 */
export const solutionAtom = codeAtom("url", "code", "codez");

export const projectAtom = atom("MathlibDemo");
