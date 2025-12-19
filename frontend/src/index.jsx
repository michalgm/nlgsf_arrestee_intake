// import * as serviceWorker from "./serviceWorker";

import { CssBaseline } from "@mui/material";
import { createTheme, StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import React from "react";
import ReactDOM from "react-dom";
import { ErrorBoundary } from 'react-error-boundary';
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#01579b",
    },
    secondary: {
      main: "#651fff",
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey="6Lfrxf4UAAAAAByrvPmn5nMVEjk_Q1RFSwumS5tv">
      <StyledEngineProvider injectFirst>
        <CssBaseline />
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </LocalizationProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </GoogleReCaptchaProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
