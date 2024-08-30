import React, { useEffect } from "react";

import { LOGIN } from "../Components/ConstantLinks";
import { CONFIG } from "../config";
import Loading from "./Loading";

const LoginPage: React.FC = () => {
  useEffect(() => {
    window.location.href = CONFIG.ENDPOINT_LINK + LOGIN;
  }, []);

  return (
    <Loading
      loadingPercentage={99}
      baseText={"You are being redirected ..."}
      subText=""
    />
  );
};

export default LoginPage;
