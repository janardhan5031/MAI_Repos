import { combineReducers } from "redux";
import persistReducer from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage";
import CounterReducer from "./CounterReducer";
import AuthReducer from "./AuthReducer";
import DataChannelReducer from "./DataChannelReducer";
import LoginReducer from "./LoginReducer";
import cartDetails from "./CartDetails";
import artistTimeSlots from "./artistTimeSlots";
import getOwnerId from "./getOwnerId";
import CustomAvatar from "./CustomAvatarReducer";
import groupId from "./groupId";

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "AuthReducer",
    "DataChannelReducer",
    "LoginReducer",
    "cartDetails",
    "artistTimeSlots",
    "getOwnerId",
    "CustomAvatar",
    "groupId",
  ],
};

const reducers = combineReducers({
  CounterReducer,
  AuthReducer,
  DataChannelReducer,
  LoginReducer,
  cartDetails,
  artistTimeSlots,
  getOwnerId,
  CustomAvatar,
  groupId,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === "LOGOUT") {
    storage.removeItem("persist:root");
    return reducers(undefined, action);
  }
  return reducers(state, action);
};

export default persistReducer(persistConfig, rootReducer);
