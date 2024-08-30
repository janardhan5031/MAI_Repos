import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { HOME } from "../Components/ConstantLinks";

const HomeLayout = () => {
  let AuthReducer = useSelector((Data: any) => Data.AuthReducer);

  return !AuthReducer ? (
    <div>
      <Outlet />
    </div>
  ) : (
    <Navigate to={HOME} />
  );
};

export default HomeLayout;
