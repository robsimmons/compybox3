import { Grid, Splitter } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { Suspense } from "react";

import ChallengePanel from "./ChallengePanel.tsx";
import Header from "./Header.tsx";
import SolutionPanel from "./SolutionPanel.tsx";
import { simpleStatusAtom } from "./store/simpleStatus.ts";
import { strokeCSS } from "./utils/style.ts";
import Verifier from "./Verifier.tsx";

export default function App() {
  const simpleStatus = useAtomValue(simpleStatusAtom);

  return (
    <Grid h="100vh" templateRows={"min-content 1fr max-content"}>
      <Header />
      <Splitter.Root
        style={{ borderBlock: `1px solid ${strokeCSS(simpleStatus)}` }}
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
