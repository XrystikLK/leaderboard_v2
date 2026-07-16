import createClient from "openapi-fetch";
import type { paths } from "./api-types.ts"; 

export const client = createClient<paths>({ baseUrl: "http://localhost:3001/" });
