import React, { useEffect, useState } from "react";
import { LOGIN, SIGNUP } from "../Components/ConstantLinks";
import { store } from "../Store";
import { CONFIG } from "../config";
import Loading from "./Loading";

const Signup: React.FC = () => {
  useEffect(() => {
    window.location.href = CONFIG.ENDPOINT_LINK + SIGNUP;
  }, []);
  return (
    <Loading
      loadingPercentage={99}
      baseText={"You are being redirected ..."}
      subText=""
    />
  );
};

export default Signup;
