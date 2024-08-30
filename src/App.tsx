import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AUTH, HOME, LOGIN, SIGNUP } from "./Components/ConstantLinks";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Home from "./Pages/Home";
import "./index.css";
import HomeLayout from "./Layouts/HomeLayout";
import { ProtectedLayout } from "./Layouts/ProtectedLayout";
import { UserLayout } from "./Layouts/UserLayout";
import Wrapper from "./Components/Wrapper";
import Auth from "./Pages/Auth";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<UserLayout />}>
            <Route path={AUTH} element={<Auth />} />
            <Route path={LOGIN} element={<Login />} />
            <Route path={SIGNUP} element={<Signup />} />
          </Route>
          <Route element={<HomeLayout />}>
            <Route path={HOME} element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
