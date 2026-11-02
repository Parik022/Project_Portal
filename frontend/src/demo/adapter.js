import { AxiosError } from "axios";
import { handle } from "./mockServer";

// Axios adapter that answers requests from the in-browser mock server.
export async function demoAdapter(config) {
  await new Promise((resolve) => setTimeout(resolve, 120)); // feel like a network call
  const url = (config.baseURL || "").replace(/\/$/, "") + config.url;
  const token = config.headers?.Authorization?.replace("Bearer ", "");
  const body = typeof config.data === "string" && config.data ? JSON.parse(config.data) : config.data;
  const result = handle((config.method || "get").toUpperCase(), url, body, token);

  const response = { data: result.raw ?? result.body, status: result.status, statusText: "", headers: {}, config, request: {} };
  if (result.status >= 400) {
    throw new AxiosError(result.body.message, AxiosError.ERR_BAD_REQUEST, config, {}, response);
  }
  return response;
}
