import { combineReducers } from "redux";
import persistReducer from "redux-persist/es/persistReducer";
import storage from "redux-persist/lib/storage";
import CounterReducer from "./CounterReducer";
import AuthReducer from "./AuthReducer";

const persistConfig = {
  key: "root",
  storage,
  whitelist: [""],
};

const reducers = combineReducers({
  CounterReducer,
  AuthReducer,
});

const rootReducer = (state: any, action: any) => {
  return reducers(state, action);
};

export default persistReducer(persistConfig, rootReducer);
