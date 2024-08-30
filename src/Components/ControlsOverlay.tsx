import React from "react";
import move from "../assets/move.png";

const ControlsOverlay = () => {
  return (
    <div className="p-8 w-full flex items-end fixed bottom-5 animate-fadeOut justify-between z-10">
      <div className="flex items-end gap-x-16 ">
        <div>
          <div className="flex gap-x-2 justify-center">
            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
              <span>W</span>
            </div>
          </div>
          <div className="mt-2 flex gap-x-2">
            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
              <span>A</span>
            </div>
            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
              <span>S</span>
            </div>
            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
              <span>D</span>
            </div>
          </div>
          <div className="mt-5 flex gap-x-2 justify-center">
            <span className="block leading-4 text-white">Player Moves</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-y-5">
          <span className="block leading-4 text-white border-[1px] border-white p-3 w-48 text-center rounded-md button-glass-effect">
            SPACE BAR
          </span>
          <span className="block leading-4 text-white">Jump</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-y-5">
        <img src={move} alt="" />
        <span className="block leading-4 text-white">
          Left click and drag to move the scene
        </span>
      </div>
    </div>
  );
};

export default ControlsOverlay;
