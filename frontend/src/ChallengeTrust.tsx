import { Box, Button, Em, Grid, Link, Span, Text } from "@chakra-ui/react";
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { produce } from "immer";
import { useAtom } from "jotai";

import { challengeHashAtom, locallyTrustedAtom, recognitionAtom } from "./store/trusted.ts";
import { bgCSS, type SimpleStatus, strokeCSS } from "./utils/style.ts";

export function ChallengeTrust() {
  const [recognition] = useAtom(recognitionAtom);
  const [challengeHash] = useAtom(challengeHashAtom);
  const recognitionType: SimpleStatus =
    recognition.type === "built-in"
      ? "neutral"
      : recognition.type === "user"
        ? "warning"
        : "failure";
  const [locallyTrusted, setLocallyTrusted] = useAtom(locallyTrustedAtom);

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
        {recognition.type === "user" && <Text fontSize="sm">{recognition.name}</Text>}
      </Box>
      {recognition.type === "none" && (
        <Box className="popsup" height="100%" backgroundColor={bgCSS(recognitionType)}>
          <Button
            className="appears"
            onClick={() => {
              const newLocallyTrusted = produce(locallyTrusted, (draft) => {
                locallyTrusted[challengeHash] = `User-defined trust (hash ${challengeHash})`;
              });
              setLocallyTrusted(newLocallyTrusted);
              alert("Trusting challenge with hash " + challengeHash);
            }}
          >
            I trust this challenge
          </Button>
        </Box>
      )}
    </Grid>
  );
}
