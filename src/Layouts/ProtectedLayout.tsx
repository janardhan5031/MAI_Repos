import { HOME, LOGIN } from "../Components/ConstantLinks";
import NotFound from "../Pages/NotFound";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export const RedirectToNotFound: any = () => {
  let AuthReducer = useSelector((Data: any) => Data.AuthReducer);

  if (AuthReducer) {
    return <NotFound />;
  } else {
    return <Navigate to={LOGIN} />;
  }
};

export const ProtectedLayout: any = () => {
  let AuthReducer = useSelector((Data: any) => Data.AuthReducer);

  return AuthReducer ? (
    <div>
      <Outlet />
    </div>
  ) : (
    <Navigate to={LOGIN} />
  );
};
