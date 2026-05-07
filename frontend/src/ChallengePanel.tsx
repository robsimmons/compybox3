import {
  Box,
  Button,
  Em,
  Grid,
  GridItem,
  Link,
  Span,
  Splitter,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { challengeAtom } from "./store/params";
import { challengeHashAtom, recognitionAtom } from "./store/trusted";
import { bgCSS, strokeCSS, type SimpleStatus } from "./utils/style";
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning";

export default function ChallengePanel() {
  const [challenge, setChallenge] = useAtom(challengeAtom);
  return (
    <Splitter.Panel id="challenge" display="grid" gridTemplateRows={"max-content 1fr max-content"}>
      <Text paddingInline="var(--chakra-spacing-3)" paddingBlock="var(--chakra-spacing-1)">
        Challenge
      </Text>
      <Grid>
        <GridItem gridArea="1/1" zIndex="1" display="grid">
          <Textarea
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
        <TrustMessage />
      </Suspense>
    </Splitter.Panel>
  );
}

export function TrustMessage() {
  const [recognition] = useAtom(recognitionAtom);
  const [challengeHash] = useAtom(challengeHashAtom);
  const recognitionType: SimpleStatus =
    recognition.type === "built-in"
      ? "neutral"
      : recognition.type === "user"
        ? "warning"
        : "failure";

  return (
    <Grid templateColumns={"1fr max-content"} borderTop={`1px solid ${strokeCSS(recognitionType)}`}>
      <Box
        paddingInline="3"
        paddingBlock="1"
        overflow="hidden"
        className="popsup"
        backgroundColor={bgCSS(recognitionType)}
      >
        {recognition.type === "none" && (
          <Text fontSize="sm">
            <FontAwesomeIcon icon={faWarning} size="sm" color={strokeCSS("failure")} /> Not a known,
            trusted challenge!{" "}
            <Em>It is critical to check for misleading or deceptive content in the challenge.</Em>
            {challengeHash}
          </Text>
        )}
        {recognition.type === "built-in" && (
          <Text fontSize="sm">
            Known challenge: "{recognition.name}"
            {recognition.sources.map((href, i) => (
              <Span key={i}>
                {" ["}
                {<Link href={href}>{i + 1}</Link>}
                {"]"}
              </Span>
            ))}
          </Text>
        )}
      </Box>
      {recognition.type === "none" && (
        <Box className="popsup" height="100%" backgroundColor={bgCSS(recognitionType)}>
          <Button className="appears">I trust this challenge</Button>
        </Box>
      )}
    </Grid>
  );
}
