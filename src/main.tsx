import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { persistor, store } from "./Store/index.tsx";
import { PersistGate } from "redux-persist/lib/integration/react";
import { onError } from "@apollo/client/link/error";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  concat,
} from "@apollo/client";
import { CONFIG } from "./config.ts";

const authMiddleware = new ApolloLink((operation, forward) => {
  const userInfo = store.getState().LoginReducer;
  if (Object.keys(userInfo).length > 0) {
    // const accesToken = userInfo?.access_token;
    const accesToken = userInfo?.access_token;

    if (accesToken) {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          // idToken: store.getState().user.idToken || null,
          Authorization: `Bearer ${accesToken}`,
        },
      }));
    }
  } else {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "x-skip-auth": true,
      },
    }));
  }
  return forward(operation);
});
const httpLink = new HttpLink({
  uri: `${CONFIG.GRAPHQL_ENDPOINT}`, // stage
  // uri: "",
});
const errorLink = onError(
  ({ graphQLErrors = {} as any, networkError = {} as any }) => {
    graphQLErrors.forEach(
      (data: { message: string; code: number; name: string }) => {
        if (
          data.message === "Token Invalid" ||
          data.message === "Token Expired"
        ) {
          store.dispatch({ type: "LOGOUT" });
        } else {
          console.log("Token error");
        }
      }
    );
  }
);
export const client = new ApolloClient({
  link: concat(authMiddleware, ApolloLink.from([errorLink, httpLink])),
  // link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <ApolloProvider client={client}>
          <App />
        </ApolloProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
