import "./style.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({});

export const system = createSystem(defaultConfig, config);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={system}>Helloooooo application</ChakraProvider>
  </StrictMode>,
);
