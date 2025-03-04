import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { BrowserRouter, useRoutes } from "react-router-dom";
import routes from "./routes";

function App() {
  const element = useRoutes(routes);
  return (
    <PrimeReactProvider>
      <ToastContainer />
      {element}
    </PrimeReactProvider>
  );
}

export default function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
