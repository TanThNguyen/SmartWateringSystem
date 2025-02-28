import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routes from "./routes";

function App() {
  const defaultRouter = createBrowserRouter(routes);

  return (
    <PrimeReactProvider>
      <ToastContainer />
      <RouterProvider router={defaultRouter}></RouterProvider>
    </PrimeReactProvider>
  )
}

export default App
