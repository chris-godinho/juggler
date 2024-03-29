// App.jsx
// Root component for the application

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";

import { setContext } from "@apollo/client/link/context";
import { ModalProvider } from "./components/contextproviders/ModalProvider.jsx";
import { NotificationProvider } from "./components/contextproviders/NotificationProvider.jsx";
import {
  ColorSchemeProvider,
  useColorScheme,
} from "./components/contextproviders/ColorSchemeProvider.jsx";
import { LayoutProvider } from "./components/contextproviders/LayoutProvider.jsx";
import { UserSettingsProvider } from "./components/contextproviders/UserSettingsProvider.jsx";

import { Outlet } from "react-router-dom";

import "./App.css";

// Construct our main GraphQL API endpoint
const httpLink = createHttpLink({
  uri: "/graphql",
});

// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem("id_token");
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  // Set up our client to execute the `authLink` middleware prior to making the request to our GraphQL API
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <ColorSchemeProvider>
        <UserSettingsProvider>
          <LayoutProvider>
            <AppContent />
          </LayoutProvider>
        </UserSettingsProvider>
      </ColorSchemeProvider>
    </ApolloProvider>
  );
}

const AppContent = () => {
  const { colorScheme } = useColorScheme();

  return (
    <div id="color-scheme-jg" className={colorScheme}>
      <NotificationProvider>
        <ModalProvider>
          <Outlet />
        </ModalProvider>
      </NotificationProvider>
    </div>
  );
};

export default App;
