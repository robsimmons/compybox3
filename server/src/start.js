import { register } from "node:module";

register("amaro/strip", import.meta.url);
await import("../src/server.ts");