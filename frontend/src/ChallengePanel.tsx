import { Grid, GridItem, Splitter, Text, Textarea } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import { Suspense } from "react";

import { ChallengeTrust } from "./ChallengeTrust.tsx";
import { challengeAtom } from "./store/params.ts";
import { statusClassAtom } from "./store/simpleStatus.ts";

export default function ChallengePanel() {
  const [challenge, setChallenge] = useAtom(challengeAtom);
  const statusClass = useAtomValue(statusClassAtom);

  return (
    <Splitter.Panel id="challenge" display="grid" gridTemplateRows="max-content 1fr max-content">
      <Text
        className={statusClass}
        fontWeight="bold"
        paddingInline="var(--chakra-spacing-3)"
        paddingBlock="var(--chakra-spacing-1)"
      >
        Challenge
      </Text>
      <Grid>
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
