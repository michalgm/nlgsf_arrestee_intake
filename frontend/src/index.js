import * as serviceWorker from "./serviceWorker";

import App from "./App";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "@material-ui/core/styles";
import { createTheme } from "@material-ui/core/styles";

const theme = createTheme({
  palette: {
    // primary: {
    //   main: "#093B37",
    // },
    // secondary: {
    //   main: "#8E4585",
    // },
    // background: {
    //   default: "#fff",
    // },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey="6Lfrxf4UAAAAAByrvPmn5nMVEjk_Q1RFSwumS5tv">
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </GoogleReCaptchaProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
