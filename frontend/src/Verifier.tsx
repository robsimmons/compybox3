import { Box, Button, Grid, Strong, Text } from "@chakra-ui/react";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { faX } from "@fortawesome/free-solid-svg-icons/faX";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { useAtomValue, useSetAtom } from "jotai";
import { type JSX } from "react";

import { statusClassAtom } from "./store/simpleStatus.ts";
import {
  comparatorJobParamsAtom,
  comparatorResultAtom,
  isComparatorSyncedAtom,
} from "./store/verifier.ts";
import { recognitionStateAtom } from "./store/trusted.ts";

export default function Verifier() {
  const statusClass = useAtomValue(statusClassAtom);
  const isComparatorSynced = useAtomValue(isComparatorSyncedAtom);
  const comparatorResult = useAtomValue(comparatorResultAtom);
  const recognitionState = useAtomValue(recognitionStateAtom);
  const reset = useSetAtom(comparatorJobParamsAtom);

  let status: JSX.Element;
  let action: JSX.Element | null;
  if (!isComparatorSynced) {
    status = (
      <Text paddingLeft="3" paddingBlock="1" marginBlock="auto">
        <Strong>Not Verified.</Strong> Press the button to request verification.
      </Text>
    );
    action = (
      <Button size="2xl" marginInline="3" marginBlock="1" onClick={() => reset()}>
        Run Verification
      </Button>
    );
  } else {
    let icon: FontAwesomeIconProps["icon"];
    switch (comparatorResult.type) {
      case "in-preparation":
      case "in-progress":
      case "in-queue": {
        status = (
          <Box paddingLeft="3" paddingBlock="1" marginBlock="auto">
            Verifying that the solution solves the challenge with comparator...
          </Box>
        );
        icon = faQuestion;
        break;
      }
      case "verification-failed": {
        status = (
          <Box paddingLeft="3" paddingBlock="1" marginBlock="auto">
            <Strong>Failed.</Strong> There are problems with this solution.
          </Box>
        );
        icon = faX;
        break;
      }

      case "verification-ok": {
        status = (
          <Box paddingLeft="3" paddingBlock="1" marginBlock="auto">
            <Strong>
              Success
              {recognitionState?.type === "none" && "fully validated against untrusted challenge"}
              {recognitionState?.type === "user" &&
                "fully validated against locally-trusted challenge"}
              .
            </Strong>{" "}
            Lean's kernel verified that the solution proves the claims described in the challenge
            {recognitionState?.type === "none" &&
              ", but it is possible that the challenge does not describe the theorems it appearsg to describe. This usually happens due to subtle oversights in the formalization statement, but it can also be the result of cheap slight-of-hand tricks that use Lean's powerful syntax extensions"}
            {recognitionState?.type === "user" &&
              ", and you have chosen to trust that this challenge correctly describes the theorems it purports to describe"}
            {recognitionState?.type === "built-in" &&
              ", and the challenge is a known to be trustworthy"}
            .
          </Box>
        );
        icon = faCheck;
        break;
      }

      default: {
        status = <>Something went weird</>;
        icon = faQuestion;
      }
    }
    action = (
      <FontAwesomeIcon
        size="3x"
        style={{ padding: "var(--chakra-spacing-3)", marginBlock: "auto" }}
        icon={icon}
        className={statusClass}
      />
    );
  }

  return (
    <Grid className={statusClass + "-bg"} templateColumns="1fr max-content">
      {status}
      {action}
    </Grid>
  );
}
