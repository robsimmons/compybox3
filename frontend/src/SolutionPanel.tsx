import { Grid, GridItem, Splitter, Text, Textarea } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";

import { solutionAtom } from "./store/params.ts";
import { statusClassAtom } from "./store/simpleStatus.ts";

export default function SolutionPanel() {
  const [solution, setSolution] = useAtom(solutionAtom);
  const statusClass = useAtomValue(statusClassAtom);

  return (
    <Splitter.Panel id="solution" display="grid" gridTemplateRows="max-content 1fr">
      <Text
        className={statusClass}
        fontWeight="bold"
        paddingInline="var(--chakra-spacing-3)"
        paddingBlock="var(--chakra-spacing-1)"
      >
        Solution
      </Text>
      <Grid>
        <GridItem gridArea="1/1" zIndex="1" display="grid">
          <Textarea
            size="xs"
            resize="none"
            fontFamily="monospace"
            border="none"
            value={solution}
            onChange={(e) => {
              setSolution(e.target.value);
            }}
          ></Textarea>
        </GridItem>
      </Grid>
    </Splitter.Panel>
  );
}
