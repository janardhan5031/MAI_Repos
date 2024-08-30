import { getServerConfig, getRTCConfiguration } from "./config.js";
import { createDisplayStringArray } from "./stats.js";
import { VideoPlayer } from "./videoplayer.js";
import { RenderStreaming } from "./renderstreaming.js";
import {
  Signaling,
  WebSocketSignaling,
} from "../../../src/Helper/js/signaling.js";
import { store } from "../../../src/Store";

/** @type {Element} */
let playButton;
/** @type {RenderStreaming} */
let renderstreaming;
/** @type {boolean} */
let useWebSocket;
/** @type {RTCDataChannel} */
let multiplayChannel;

const codecPreferences = document.getElementById("codecPreferences");
console.log(codecPreferences, "codecPreferences");
if (window.location.pathname === "/") {
  codecPreferences.style.display = "none";
}
const supportsSetCodecPreferences =
  window.RTCRtpTransceiver &&
  "setCodecPreferences" in window.RTCRtpTransceiver.prototype;

const playerDiv = document.getElementById("player");
const lockMouseCheck = document.getElementById("lockMouseCheck");
if (window.location.pathname === "/") {
  lockMouseCheck.style.display = "none";
}
const videoPlayer = new VideoPlayer();
if (window.location.pathname === "/") {
  setup();
}
window.document.oncontextmenu = function () {
  return false; // cancel default menu
};

window.addEventListener(
  "resize",
  function () {
    videoPlayer.resizeVideo();
  },
  true
);

window.addEventListener(
  "beforeunload",
  async () => {
    if (!renderstreaming) return;
    await renderstreaming.stop();
  },
  true
);

async function setup() {
  const res = await getServerConfig();
  useWebSocket = res.useWebSocket;
  showWarningIfNeeded(res.startupMode);
  showCodecSelect();
  showPlayButton();
}

function showWarningIfNeeded(startupMode) {
  const warningDiv = document.getElementById("warning");
  if (startupMode == "private") {
    warningDiv.innerHTML =
      "<h4>Warning</h4> This sample is not working on Private Mode.";
    warningDiv.hidden = false;
  }
}

function showPlayButton() {
  console.log("Hello from the server side");
  if (!document.getElementById("playButton")) {
    onClickPlayButton();
  }
}

window.myNewPlayFunction = function (data) {
  console.log("Hello from the server side");
  if (!document.getElementById("playButton")) {
    onClickPlayButton();
  }
};

// onClickPlayButton()

function onClickPlayButton() {
  // playButton.style.display = "none";

  // add video player
  videoPlayer.createPlayer(playerDiv, lockMouseCheck);
  setupRenderStreaming();
}

async function setupRenderStreaming() {
  codecPreferences.disabled = true;
  const signaling = useWebSocket ? new WebSocketSignaling() : new Signaling();
  const config = getRTCConfiguration();
  renderstreaming = new RenderStreaming(signaling, config);
  renderstreaming.onConnect = onConnect;
  renderstreaming.onDisconnect = onDisconnect;
  renderstreaming.onTrackEvent = (data) => videoPlayer.addTrack(data.track);
  renderstreaming.onGotOffer = setCodecPreferences;
  await renderstreaming.start();
  await renderstreaming.createConnection();
}

function onConnect() {
  const channel = renderstreaming.createDataChannel("input");
  videoPlayer.setupInput(channel);
  multiplayChannel = renderstreaming.createDataChannel("multiplay");
  multiplayChannel.onopen = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "w" ||
      event.key === "s" ||
      event.key === "a" ||
      event.key === "d" ||
      event.key === "W" ||
      event.key === "S" ||
      event.key === "A" ||
      event.key === "D" ||
      event.key === "Spacebar" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      document.body.style.cursor = "none";
    }
  });

  document.addEventListener("keyup", function (event) {
    if (
      event.key === "w" ||
      event.key === "s" ||
      event.key === "a" ||
      event.key === "d" ||
      event.key === "W" ||
      event.key === "S" ||
      event.key === "A" ||
      event.key === "D" ||
      event.key === "Spacebar" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      document.body.style.cursor = "auto";
    }
  });

  multiplayChannel.onclose = () =>
    console.log("Data channel with Unity is closed");
  multiplayChannel.onerror = (error) =>
    console.error("Data channel error:", error);
  multiplayChannel.onmessage = (event) => {
    console.log("Message from Unity:", event.data);
    // Handle incoming messages here
  };
  showStatsMessage();
}

export function SendData(data) {
  console.log(data, "DataFromSendData");
}

window.myCustomFunction = function (data) {
  console.log(
    JSON.stringify({
      messageType: "Gesture",
      data: {
        gestureName: data.name,
        gestureId: data.id,
      },
    }),
    "datadata"
  );
  multiplayChannel.send(
    JSON.stringify({
      messageType: "Gesture",
      data: {
        gestureName: data.name,
        gestureId: data.id,
      },
    })
  );
};

window.myDisconnectFunction = function () {
  onDisconnect();
};

async function onDisconnect() {
  clearStatsMessage();
  await renderstreaming.stop();
  renderstreaming = null;
  videoPlayer.deletePlayer();
  if (supportsSetCodecPreferences) {
    codecPreferences.disabled = false;
  }
  showPlayButton();
}

function setCodecPreferences() {
  /** @type {RTCRtpCodecCapability[] | null} */
  let selectedCodecs = null;
  if (supportsSetCodecPreferences) {
    const preferredCodec =
      codecPreferences.options[codecPreferences.selectedIndex];
    if (preferredCodec.value !== "") {
      const [mimeType, sdpFmtpLine] = preferredCodec.value.split(" ");
      const { codecs } = RTCRtpSender.getCapabilities("video");
      const selectedCodecIndex = codecs.findIndex(
        (c) => c.mimeType === mimeType && c.sdpFmtpLine === sdpFmtpLine
      );
      const selectCodec = codecs[selectedCodecIndex];
      selectedCodecs = [selectCodec];
    }
  }

  if (selectedCodecs == null) {
    return;
  }
  const transceivers = renderstreaming
    .getTransceivers()
    .filter((t) => t.receiver.track.kind == "video");
  if (transceivers && transceivers.length > 0) {
    transceivers.forEach((t) => t.setCodecPreferences(selectedCodecs));
  }
}

function showCodecSelect() {
  const codecs = RTCRtpSender.getCapabilities("video").codecs;
  codecs.forEach((codec) => {
    if (["video/red", "video/ulpfec", "video/rtx"].includes(codec.mimeType)) {
      return;
    }
    const option = document.createElement("option");
    option.value = (codec.mimeType + " " + (codec.sdpFmtpLine || "")).trim();
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;
}

/** @type {RTCStatsReport} */
let lastStats;
/** @type {number} */
let intervalId;

function showStatsMessage() {
  intervalId = setInterval(async () => {
    if (renderstreaming == null) {
      return;
    }

    const stats = await renderstreaming.getStats();
    if (stats == null) {
      return;
    }

    const array = createDisplayStringArray(stats, lastStats);
    lastStats = stats;
  }, 1000);
}

function clearStatsMessage() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  lastStats = null;
  intervalId = null;
}
