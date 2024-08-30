import { Unity, useUnityContext } from "react-unity-webgl";
import { useEffect } from "react";
import { CONFIG } from "../config";
import { useLocation } from "react-router-dom";
import Loading from "./Loading";

const Configurator = () => {
  const location = useLocation();
  const queryParams = Object.fromEntries(new URLSearchParams(location.search));
  const { unityProvider, isLoaded, loadingProgression, sendMessage } =
    useUnityContext({
      loaderUrl: `${CONFIG.CONFIGURATORPAGE_LINK + "Builds.loader.js"}`,
      dataUrl: `${CONFIG.CONFIGURATORPAGE_LINK + "Builds.data.unityweb"}`,
      frameworkUrl: `${
        CONFIG.CONFIGURATORPAGE_LINK + "Builds.framework.js.unityweb"
      }`,
      codeUrl: `${CONFIG.CONFIGURATORPAGE_LINK + "Builds.wasm.unityweb"}`,
      streamingAssetsUrl: `${CONFIG.ASSET_LINK + "StreamingAssets"}`,
      cacheControl: (url: any) => "no-store",
    });
  const loadingPercentage = Math.round(loadingProgression * 100);

  useEffect(() => {
    const clearBrowserCache = async () => {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      const databases = await indexedDB.databases();
      databases.forEach(async (dbInfo) => {
        await indexedDB.deleteDatabase(dbInfo.name);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("GET", window.location.href, true);
      xhr.setRequestHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );
      xhr.setRequestHeader("Pragma", "no-cache");
      xhr.setRequestHeader("Expires", "0");
      xhr.send();
      localStorage.clear();
      sessionStorage.clear();
    };
    clearBrowserCache();
    if (isLoaded === true) {
      sendMessage(
        "WebGlCommunication",
        "OnMessage",
        JSON.stringify({
          messageType: "Initialize",
          data: {
            accessToken: queryParams.accessToken,
            mode: queryParams.mode,
            serverUrl: CONFIG.API_ENDPOINT,
            eventId: queryParams.eventId,
            sceneName: queryParams.sceneName ? queryParams.sceneName : "HOE",
            kioskId: queryParams.kioskId,
            //Hall of Eternity === HOE || HOP
          },
        })
      );
    }
  }, [isLoaded]);

  return (
    <>
      {isLoaded === false && (
        <Loading
          loadingPercentage={loadingPercentage}
          baseText={"Your experience is being loaded"}
          subText={
            "Once it is ready, you can enter the event. This may take up to 10 minutes, please do not refresh the page."
          }
        />
      )}
      <Unity className="w-screen h-screen" unityProvider={unityProvider} />
    </>
  );
};

export default Configurator;
