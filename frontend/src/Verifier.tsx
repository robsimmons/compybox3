import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

import {
  comparatorAtom,
  comparatorEffect,
  comparatorJobParamsAtom,
  isComparatorSyncedAtom,
} from "./store/verifier.ts";
import { simpleStatusAtom } from "./store/simpleStatus.ts";
import { Box, Button, Grid, Strong, Text } from "@chakra-ui/react";
import { bgCSS } from "./utils/style.ts";

export default function Verifier() {
  return (
    <>
      <VerifyMessage />
    </>
  );
}

export function VerifyMessage() {
  const simpleStatus = useAtomValue(simpleStatusAtom);
  const comparator = useAtomValue(comparatorAtom);
  const reset = useSetAtom(comparatorJobParamsAtom);
  useAtomValue(comparatorEffect);
  useEffect(() => reset(), [reset]);

  return (
    <Grid backgroundColor={bgCSS(simpleStatus)} templateRows="1fr max-content">
      {simpleStatus === "stale" && (
        <>
          <Text>
            <Strong>Not Verified:</Strong> press the button to run verification:
          </Text>
          <Button size="lg" onClick={() => reset()}>
            Run Verification
          </Button>
        </>
      )}
      {simpleStatus === "working" && (
        <>
          <Text>Verifying that the solution solves the challenge with comparator...</Text>
        </>
      )}
      {JSON.stringify(comparator)}
      <button onClick={() => reset()}>Reset</button>
    </Grid>
  );
}
