import { Box, Button, Em, Grid, Link, Span, Text } from "@chakra-ui/react";
import { faWarning } from "@fortawesome/free-solid-svg-icons/faWarning";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { produce } from "immer";
import { useAtom } from "jotai";

import { challengeHashAtom, locallyTrustedAtom, recognitionAtom } from "./store/trusted.ts";
import { borderForStatus, type SimpleStatus } from "./utils/style.ts";

export function ChallengeTrust() {
  const [recognition] = useAtom(recognitionAtom);
  const [challengeHash] = useAtom(challengeHashAtom);
  const recognitionStatus: SimpleStatus =
    recognition.type === "built-in"
      ? "neutral"
      : recognition.type === "user"
        ? "warning"
        : "failure";
  const [locallyTrusted, setLocallyTrusted] = useAtom(locallyTrustedAtom);

  // Hash for the empty challenge
  if (challengeHash === "1ba4719c8b6fe911b091a7c05124b64eeece964e9c058ef8f985daca546b") return null;

  return (
    <Grid templateColumns={"1fr max-content"} borderTop={borderForStatus(recognitionStatus)}>
      <Box
        className={`${recognitionStatus}-bg popsup`}
        paddingInline="3"
        paddingBlock="1"
        overflow="hidden"
      >
        {recognition.type === "none" && (
          <Text fontSize="sm">
            <FontAwesomeIcon icon={faWarning} size="sm" className={recognitionStatus} /> Not a
            known, trusted challenge!{" "}
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
        <Box className={`${recognitionStatus}-bg popsup`} height="100%">
          <Button
            className="appears"
            onClick={() => {
              const newLocallyTrusted = produce(locallyTrusted, (draft) => {
                draft[challengeHash] = `User-defined trust (hash ${challengeHash})`;
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
