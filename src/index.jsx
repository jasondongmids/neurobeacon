import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils"
import outputs from "../amplify_outputs.json"

const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure({
  ...amplifyConfig,
  API: {
    ...amplifyConfig.API,
    REST: {
      ...amplifyConfig.API?.REST,
      neurobeaconModel: {
        endpoint: "https://wko6ofylnd.execute-api.us-east-1.amazonaws.com/",
        region: "us-east-1"
      }
    }
  }
})

// Amplify.configure(outputs);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
