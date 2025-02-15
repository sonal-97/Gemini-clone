import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ContextProvider from './context/Context.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ContextProvider>{/*this is a global state that any component can access// so it makes it easy in react and at the same time we can use it in many values instead of react strict.*/}
    <App />
  </ContextProvider>,{/*gives us the support of context api*/}
)
