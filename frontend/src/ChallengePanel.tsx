import { Flex, Grid, GridItem, Splitter, Text, Textarea } from "@chakra-ui/react";
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtom, useAtomValue } from "jotai";
import { Suspense } from "react";

import { ChallengeTrust } from "./ChallengeTrust.tsx";
import { challengeAtom } from "./store/params.ts";
import { statusClassAtom } from "./store/simpleStatus.ts";
import { recognitionStateAtom } from "./store/trusted.ts";

export default function ChallengePanel() {
  const [challenge, setChallenge] = useAtom(challengeAtom);
  const statusClass = useAtomValue(statusClassAtom);
  const recognitionState = useAtomValue(recognitionStateAtom);

  return (
    <Splitter.Panel id="challenge" display="grid" gridTemplateRows="max-content 1fr max-content">
      <Text className={statusClass} fontWeight="bold" paddingInline={3} paddingBlock={1}>
        Challenge
      </Text>
      <Grid>
        {challenge.trim() === "" && (
          <GridItem gridArea="1/1" zIndex={0}>
            <Grid templateColumns="min-content 1fr">
              <FontAwesomeIcon
                className="fa-background"
                icon={faWarning}
                color="oklch(0.8804 0.1662 91.97)"
                size="10x"
              />
              <Flex
                flexDirection="column"
                paddingTop="var(--chakra-spacing-6)"
                paddingRight="var(--chakra-spacing-3)"
              >
                <Text fontSize="2rem" fontWeight="bold">
                  No Challenge
                </Text>
                <Text>
                  For full verification, paste a challenge here or select one from the menu above.
                </Text>
              </Flex>
            </Grid>
          </GridItem>
        )}
        {recognitionState?.type === "none" && (
          <GridItem gridArea="1/1" zIndex={0}>
            <FontAwesomeIcon
              icon={faWarning}
              className="fa-background failure-fa-background"
              size="10x"
            />
          </GridItem>
        )}
        <GridItem gridArea="1/1" zIndex="1" display="grid">
          <Textarea
            size="xs"
            resize="none"
            fontFamily="monospace"
            border="none"
            value={challenge}
            onChange={(e) => {
              setChallenge(e.target.value);
            }}
          ></Textarea>
        </GridItem>
      </Grid>
      <Suspense>
        <ChallengeTrust />
      </Suspense>
    </Splitter.Panel>
  );
}
