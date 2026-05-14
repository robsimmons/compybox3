import { Box, Grid, GridItem, Splitter, Text, useBreakpointValue } from "@chakra-ui/react";
import { useAtomValue } from "jotai";

import ChallengePanel from "./ChallengePanel.tsx";
import Header from "./Header.tsx";
import SolutionPanel from "./SolutionPanel.tsx";
import { statusClassAtom } from "./store/simpleStatus.ts";
import { borderForStatus } from "./utils/style.ts";
import Verifier from "./Verifier.tsx";
import { projectAtom, projectSelectionAtom } from "./store/params.ts";

export default function App() {
  const project = useAtomValue(projectAtom);
  const projectSelection = useAtomValue(projectSelectionAtom);
  const statusClass = useAtomValue(statusClassAtom);
  const orientation = useBreakpointValue<"horizontal" | "vertical">({
    base: "vertical",
    md: "horizontal",
  });

  return (
    <Grid h="100vh" templateRows={"min-content 1fr max-content"}>
      <Header />
      <GridItem gridArea="2/1">
        <Splitter.Root
          orientation={orientation}
          style={{ borderBlock: borderForStatus(statusClass) }}
          panels={[{ id: "challenge" }, { id: "solution" }]}
        >
          <ChallengePanel />
          <Splitter.ResizeTrigger id="challenge:solution">
            <Splitter.ResizeTriggerSeparator className={statusClass + "-bg"} />
            <Splitter.ResizeTriggerIndicator className={statusClass + "-bg"} />
          </Splitter.ResizeTrigger>
          <SolutionPanel />
        </Splitter.Root>
      </GridItem>
      {projectSelection === "unknown" && (
        <GridItem
          display="flex"
          justifyContent="center"
          alignContent="center"
          gridArea="2/1"
          zIndex={99}
          backgroundColor={"rgba(255,255,255,50%)"}
        >
          <Box
            backgroundColor="white"
            padding="3"
            border="3px solid black"
            borderRadius="1rem"
            maxWidth="50%"
            height="min-content"
            margin="auto"
          >
            <Text>Comparator Live does not support the project '{project}'</Text>
            <Text>Select a different project from the header menu to continue.</Text>
          </Box>
        </GridItem>
      )}
      {projectSelection !== "unknown" && <Verifier />}
    </Grid>
  );
}
