import { Unity, useUnityContext } from "react-unity-webgl";
import Loading from "./Loading";
import { useLocation } from "react-router-dom";
import { CONFIG } from "../config";
const Home = () => {
  const location = useLocation();
  const queryParams = Object.fromEntries(new URLSearchParams(location.search));
  const { unityProvider, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: `${CONFIG.HOMEPAGE_LINK + "Builds.loader.js"}`,
    dataUrl: `${CONFIG.HOMEPAGE_LINK + "Builds.data.unityweb"}`,
    frameworkUrl: `${CONFIG.HOMEPAGE_LINK + "Builds.framework.js.unityweb"}`,
    codeUrl: `${CONFIG.HOMEPAGE_LINK + "Builds.wasm.unityweb"}`,
  });
  const loadingPercentage = Math.round(loadingProgression * 100);

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

export default Home;
