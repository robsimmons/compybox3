import "./style.css";

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { getDefaultStore } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { comparatorJobParamsAtom } from "./store/verifier.ts";

const config = defineConfig({});

export const system = createSystem(defaultConfig, config);

getDefaultStore().set(comparatorJobParamsAtom)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
