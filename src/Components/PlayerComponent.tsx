import React, { useEffect } from "react";
import { SendDanceMoves } from "../../public/Experience/js/receiver.js";

function PlayerComponent() {
  // SendDanceMoves({ name: "move.name", id: "move.unityDanceId" });

  return (
    <div className="relative z-10 w-full h-full bg-black" id="player">
      {/* Other HTML elements */}
      <div id="container">
        <div className="box hidden">
          <select
            title="select"
            id="codecPreferences"
            autoComplete="off"
            disabled
          >
            <option selected value="">
              Default
            </option>
            {/* Add other options as needed */}
          </select>
        </div>
        <div className="box hidden">
          <input
            title="input"
            type="checkbox"
            id="lockMouseCheck"
            autoComplete="off"
            checked={false}
          />
        </div>
      </div>
    </div>
  );
}

export default PlayerComponent;
