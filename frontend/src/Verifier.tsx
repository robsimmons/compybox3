import {
  Box,
  Button,
  CloseButton,
  Code,
  Dialog,
  Grid,
  Portal,
  Strong,
  Text,
} from "@chakra-ui/react";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import { faQuestion } from "@fortawesome/free-solid-svg-icons/faQuestion";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { useAtomValue, useSetAtom } from "jotai";
import { type JSX, useState } from "react";

import { statusClassAtom } from "./store/simpleStatus.ts";
import { recognitionStateAtom } from "./store/trusted.ts";
import {
  comparatorJobParamsAtom,
  comparatorResultAtom,
  isComparatorSyncedAtom,
} from "./store/verifier.ts";

export default function Verifier() {
  const statusClass = useAtomValue(statusClassAtom);
  const isComparatorSynced = useAtomValue(isComparatorSyncedAtom);
  const comparatorResult = useAtomValue(comparatorResultAtom);
  const recognitionState = useAtomValue(recognitionStateAtom);
  const reset = useSetAtom(comparatorJobParamsAtom);
  const [isOpen, setIsOpen] = useState(false);

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
  } else if (comparatorResult.type === "verification-failed") {
    status = (
      <Box paddingLeft="3" paddingBlock="1" marginBlock="auto">
        <Strong>Failed.</Strong> There are problems with this solution:{" "}
        {comparatorResult.description}
      </Box>
    );
    action = (
      <>
        <Button size="2xl" marginInline="3" marginBlock="1" onClick={(e) => setIsOpen(true)}>
          See Errors
        </Button>
        <Dialog.Root role="dialog" open={isOpen} size="xl" onOpenChange={(e) => setIsOpen(e.open)}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.CloseTrigger asChild>
                  <CloseButton />
                </Dialog.CloseTrigger>
                <Dialog.Header>
                  <Dialog.Title>{comparatorResult.description}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Code as="pre" overflowX="scroll" width="100%">
                    {comparatorResult.output}
                  </Code>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </>
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

      case "verification-ok": {
        status = (
          <Box paddingLeft="3" paddingBlock="1" marginBlock="auto">
            {comparatorResult.theoremNames.length === 0 && (
              <>
                <Strong>Internal Consistency of Solution Verified.</Strong> Lean's kernel verified
                that the solution makes sense, but there are no theorems stated in the challenge.
                Therefore, it's not possible to verify the contents of the solution against a
                challenge.
              </>
            )}
            {comparatorResult.theoremNames.length > 0 && (
              <>
                <Strong>
                  Success
                  {/* transform into "Successfully" if it's a qualified success*/}
                  {recognitionState?.type === "none" &&
                    "fully validated against untrusted challenge"}
                  {recognitionState?.type === "user" &&
                    "fully validated against locally-trusted challenge"}
                  .
                </Strong>{" "}
                Lean's kernel verified that the solution proves the claims described in the
                challenge's theorem{comparatorResult.theoremNames.length > 1 && "s"}{" "}
                {comparatorResult.theoremNames.map((name) => (
                  <Code key={name}>{name}</Code>
                ))}
                {recognitionState?.type === "none" &&
                  ", but it is possible that the challenge does not describe the theorems it appears to describe. This usually happens due to subtle oversights in the formalization statement, but it can also be the result of cheap slight-of-hand tricks that use Lean's powerful syntax extensions"}
                {recognitionState?.type === "user" &&
                  `, and you have chosen to trust that this challenge correctly describes the theorem${comparatorResult.theoremNames.length > 1 ? "s" : ""} it purports to describe`}
                {recognitionState?.type === "built-in" &&
                  ", and the challenge is known to be trustworthy"}
                .
              </>
            )}
          </Box>
        );
        icon = faCheck;
        break;
      }

      default: {
        status = (
          <Box paddingLeft="3" paddingBlock="1" marginBlock="auto">
            An unexpected condition occurred ({JSON.stringify(comparatorResult)}). Reloading and
            trying again may help.
          </Box>
        );
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
