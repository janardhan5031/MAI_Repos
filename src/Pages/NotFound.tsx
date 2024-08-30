import React from "react";
import mai from "../assets/mai_logo.png";

const NotFound = () => {
  return (
    <div className="loading-overlay">
      {/* <p>Loading... ({loadingPercentage}%)</p> */}
      <div className="h-full flex  flex-col py-96 justify-center items-center">
        <div className="relative w-40 h-40">
          <img
            src={mai}
            className="w-20 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2"
            alt=""
          />
        </div>
        <div className=" text-lg font-semibold text-center">
          {"Page Not Found"}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
