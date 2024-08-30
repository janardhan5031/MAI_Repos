import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { AUTH, HOME, LOGIN } from "../Components/ConstantLinks";

const HomeLayout = () => {
  const AuthReducer = useSelector((Data: any) => Data.AuthReducer);
  return AuthReducer ? <Outlet /> : <Navigate to={AUTH} />;
};

export default HomeLayout;
