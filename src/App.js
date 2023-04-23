import "./App.css";
import "./styles/main.css";
import "./styles/room.css";
import "./styles/lobby.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Lobby from "./Screens/Lobby";
import Room from "./Screens/Room";

function App() {
  return (
    <>
      <Routes>
        <Route path="/lobby" element={<Lobby />}></Route>
        <Route path="/room" element={<Room />}></Route>
        <Route path="*" element={<Navigate to="/lobby" />} />
      </Routes>
    </>
  );
}

export default App;
