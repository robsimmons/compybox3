import { Em, Flex, Grid, GridItem, Portal, Select, Text } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";

import { leanConfigs, projectAtom, projectSelectionAtom } from "./store/params.ts";
import { statusClassAtom } from "./store/simpleStatus.ts";

export default function Header() {
  const statusClass = useAtomValue(statusClassAtom);
  const [project, setProject] = useAtom(projectAtom);
  const projectSelection = useAtomValue(projectSelectionAtom);

  return (
    <Grid
      templateRows={{ base: "1fr 1fr", md: "1fr" }}
      templateColumns={{ base: "max-content 1fr", md: "max-content 1fr 300px" }}
    >
      <svg
        className={statusClass}
        style={{ paddingInline: "0.7rem", marginBlock: "auto", height: "1rem", width: "auto" }}
        viewBox="0 0 486 169"
        xmlns="http://www.w3.org/2000/svg"
        fill="transparent"
        strokeWidth="10"
      >
        <path
          d="M206.333 5.67949H105.667M206.333 5.67949L243.25 84.5M206.333 5.67949V84.5M243.25 84.5H317.549M243.25 84.5L279.667 163.321L280.889 163.318L317.549 84.5M206.333 84.5V163.321H5V5M206.333 84.5H105.667M317.549 84.5L353 5.67949M353 5.67949V164M353 5.67949H353.667L480.333 163.454H481V5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          color="currentColor"
        ></path>
      </svg>
      <Text marginBlock="auto" flexGrow="1" className={statusClass}>
        Comparator Live <Em>(Experimental)</Em>
      </Text>
      <GridItem colSpan={{ base: 2, md: 1 }}>
        <Flex>
          <Select.Root
            collection={leanConfigs}
            defaultValue={["MathlibDemo"]}
            value={[projectSelection]}
            onValueChange={(e) => {
              if (e.value.length !== 1) return;
              setProject(e.value[0]!);
            }}
          >
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
                  {leanConfigs.items
                    .filter((leanConfig) => {
                      return leanConfig.value !== "unknown" || projectSelection === "unknown";
                    })
                    .map((leanConfig) => (
                      <Select.Item item={leanConfig} key={leanConfig.value}>
                        {leanConfig.value === "unknown"
                          ? `Unsupported project "${project}"`
                          : leanConfig.label}
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
