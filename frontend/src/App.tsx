import { Grid, Splitter } from "@chakra-ui/react";
import { useAtomValue } from "jotai";

import ChallengePanel from "./ChallengePanel.tsx";
import Header from "./Header.tsx";
import SolutionPanel from "./SolutionPanel.tsx";
import { statusClassAtom } from "./store/simpleStatus.ts";
import { borderForStatus } from "./utils/style.ts";
import Verifier from "./Verifier.tsx";

export default function App() {
  const statusClass = useAtomValue(statusClassAtom);

  return (
    <Grid h="100vh" templateRows={"min-content 1fr max-content"}>
      <Header />
      <Splitter.Root
        style={{ borderBlock: borderForStatus(statusClass) }}
        panels={[{ id: "challenge" }, { id: "solution" }]}
      >
        <ChallengePanel />
        <Splitter.ResizeTrigger id="challenge:solution" />
        <SolutionPanel />
      </Splitter.Root>
      <Verifier />
    </Grid>
  );
}
