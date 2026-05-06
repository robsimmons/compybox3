import { Grid, Splitter } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { Suspense } from "react";

import ChallengePanel from "./ChallengePanel";
import { solutionAtom } from "./store/params";
import Verifier from "./Verifier";

export default function App() {
  const [solution] = useAtom(solutionAtom);

  return (
    <Grid h="100vh" templateRows={"min-content 1fr max-content"}>
      <Grid templateColumns={"max-content 1fr max-content"}></Grid>
      <Splitter.Root panels={[{ id: "challenge" }, { id: "solution" }]}>
        <ChallengePanel />
        <Splitter.ResizeTrigger id="challenge:solution" />
        <Splitter.Panel id="solution">{solution}</Splitter.Panel>
      </Splitter.Root>
      <Suspense fallback={"Loading..."}>
        <Verifier />
      </Suspense>
    </Grid>
  );
}
