import { Grid, Splitter } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import { Suspense } from "react";

import ChallengePanel from "./ChallengePanel";
import Header from "./Header";
import { solutionAtom } from "./store/params";
import { simpleStatusAtom } from "./store/simpleStatus";
import Verifier from "./Verifier";
import { strokeCSS } from "./utils/style";

export default function App() {
  const [solution] = useAtom(solutionAtom);
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
        <Splitter.Panel id="solution">{solution}</Splitter.Panel>
      </Splitter.Root>
      <Suspense fallback={"Loading..."}>
        <Verifier />
      </Suspense>
    </Grid>
  );
}
