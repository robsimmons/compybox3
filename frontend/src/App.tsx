import { useAtom, useAtomValue } from "jotai";
import { atomWithHash } from "jotai-location";
import { useEffect } from "react";

const a = atomWithHash("a", "hello");
const c = atomWithHash("c", "goodbye");

export default function App() {
  const ax = useAtomValue(a);
  const [cv, setC] = useAtom(c);

  useEffect(() => {
    setC("addd");
  }, []);

  return (
    <>
      {ax}/{cv}
    </>
  );
}
