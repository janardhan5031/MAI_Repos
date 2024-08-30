import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { HOME } from "../Components/ConstantLinks";
import { store } from "../Store";

export const UserLayout: any = () => {
  const AuthReducer = useSelector((Data: any) => Data.AuthReducer);
  const queryParams = Object?.fromEntries(
    new URLSearchParams(location?.search)
  );
  const EventId_Local = useSelector(
    (data: any) => data.DataChannelReducer?.eventId
  );
  const EventId_actual = queryParams?.eventId;

  const role_Local = useSelector((data: any) => data.DataChannelReducer?.role);

  const role_actual = queryParams?.role;

  const accessToken_Local = useSelector(
    (data: any) => data.DataChannelReducer?.accessToken
  );

  const accesstoken_actual = queryParams?.accessToken;

  if (
    EventId_Local !== EventId_actual ||
    role_Local !== role_actual ||
    accessToken_Local !== accesstoken_actual
  ) {
    store.dispatch({
      type: "LOGOUT",
    });
  }
  return !AuthReducer ? (
    <div className="">
      <Outlet />
    </div>
  ) : (
    <Navigate to={HOME} />
  );
};
