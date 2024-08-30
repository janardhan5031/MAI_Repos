import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CONFIGURATOR, HOME, LOGIN, SIGNUP } from "./Components/ConstantLinks";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Home from "./Pages/Home";
import "./index.css";
import HomeLayout from "./Layouts/HomeLayout";
import { ProtectedLayout } from "./Layouts/ProtectedLayout";
import Configurator from "./Pages/Configurator";
import NotFound from "./Pages/NotFound";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={LOGIN} element={<Login />} />
          <Route path={SIGNUP} element={<Signup />} />
          <Route path={HOME} element={<Home />} />
          <Route path={CONFIGURATOR} element={<Configurator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
