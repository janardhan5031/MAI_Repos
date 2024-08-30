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
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      "x-skip-auth": true,
    },
  }));

  return forward(operation);
});

const httpLink = new HttpLink({
  uri: `${CONFIG.API_ENDPOINT}`,
});
const errorLink = onError(
  ({ graphQLErrors = {} as any, networkError = {} as any }) => {
    console.log(networkError, graphQLErrors);
  }
);
export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
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
