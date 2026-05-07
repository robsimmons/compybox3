import {
  createListCollection,
  Em,
  Flex,
  Grid,
  GridItem,
  Portal,
  Select,
  Text,
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";

import { simpleStatusAtom } from "./store/simpleStatus";
import { strokeCSS } from "./utils/style";

const leanConfigs = createListCollection({
  items: [{ label: "Latest Mathlib", value: "MathlibDemo" }],
});

export default function Header() {
  const simpleStatus = useAtomValue(simpleStatusAtom);
  return (
    <Grid
      templateRows={{ base: "1fr 1fr", md: "1fr" }}
      templateColumns={{ base: "max-content 1fr", md: "max-content 1fr 300px" }}
    >
      <svg
        style={{ stroke: strokeCSS(simpleStatus), padding: "0.7rem", height: "100%" }}
        viewBox="0 0 486 169"
        xmlns="http://www.w3.org/2000/svg"
        fill="transparent"
        strokeWidth="10"
      >
        <path
          d="M206.333 5.67949H105.667M206.333 5.67949L243.25 84.5M206.333 5.67949V84.5M243.25 84.5H317.549M243.25 84.5L279.667 163.321L280.889 163.318L317.549 84.5M206.333 84.5V163.321H5V5M206.333 84.5H105.667M317.549 84.5L353 5.67949M353 5.67949V164M353 5.67949H353.667L480.333 163.454H481V5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
      <Text marginBlock="auto" flexGrow="1" color={strokeCSS(simpleStatus)}>
        Comparator <Em>(Experimental)</Em>
      </Text>
      <GridItem colSpan={{ base: 2, md: 1 }}>
        <Flex>
          <Select.Root collection={leanConfigs} defaultValue={["MathlibDemo"]}>
            <Select.HiddenSelect />
            <Select.Label hidden={true}>Select Lean Project Configuration</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select project configuration" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {leanConfigs.items.map((leanConfig) => (
                    <Select.Item item={leanConfig} key={leanConfig.value}>
                      {leanConfig.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Flex>
      </GridItem>
    </Grid>
  );
}
