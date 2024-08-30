import { getServers } from "./icesettings.js";
import { CONFIG } from "../../../src/config.ts";
import { store } from "../../../src/Store/index.tsx";

export async function getServerConfig() {
  const protocolEndPointHOE = `https://${CONFIG.SIGNELLING_SERVER_HOE}/config`;
  const protocolEndPointHOP = `https://${CONFIG.SIGNELLING_SERVER_HOP}/config`;
  const createResponse = await fetch(
    store.getState().DataChannelReducer?.venueName === "HOE"
      ? protocolEndPointHOE
      : protocolEndPointHOP
  );
  return await createResponse.json();
}

export function getRTCConfiguration() {
  let config = {};
  config.sdpSemantics = "unified-plan";
  config.iceServers = getServers();
  return config;
}
