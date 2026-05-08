import { Box, Button, Grid, Strong, Text } from "@chakra-ui/react";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { faX } from "@fortawesome/free-solid-svg-icons/faX";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { useAtomValue, useSetAtom } from "jotai";
import { type JSX, useEffect } from "react";

import { simpleStatusAtom } from "./store/simpleStatus.ts";
import { comparatorAtom, comparatorEffect, comparatorJobParamsAtom } from "./store/verifier.ts";
import { bgCSS, strokeCSS } from "./utils/style.ts";

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

  let status: JSX.Element;
  let action: JSX.Element | null;
  if (simpleStatus === "stale") {
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
    switch (comparator.type) {
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
            <Strong>Success.</Strong> Lean's kernel verified that the solution proves the claims
            described in the challenge.
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
        color={strokeCSS(simpleStatus)}
      />
    );
  }

  return (
    <Grid backgroundColor={bgCSS(simpleStatus)} templateColumns="1fr max-content">
      {status}
      {action}
    </Grid>
  );
}
