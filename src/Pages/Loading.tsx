import React from "react";
import mai from "../assets/mai_logo.png";
import ProgressBar from "@ramonak/react-progress-bar";

interface LoadingPageProps {
  loadingPercentage: number;
  baseText: string;
  subText: string; // Example prop, replace with your actual prop type
}

const Loading: React.FC<LoadingPageProps> = ({
  loadingPercentage,
  baseText,
  subText,
}) => {
  return (
    <div className="loading-overlay">
      {/* <p>Loading... ({loadingPercentage}%)</p> */}
      <div className="h-full flex justify-center items-center">
        <div className="fixed top-0 left-0 flex flex-col items-center justify-center w-full h-full z-50">
          <div className="relative w-40 h-40">
            <div
              className="inline-block h-40 w-40 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-[#DB0279] motion-reduce:animate-[loader_1.5s_linear_infinite]"
              role="status"
            ></div>
            <img
              src={mai}
              className="w-20 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2"
              alt=""
            />
          </div>
          <div className="py-4 text-2xl font-bold text-center">{baseText}</div>
          <div className="text-[#000000] font-normal text-center">
            {subText}
          </div>
          <div className="my-4">
            <ProgressBar
              completed={loadingPercentage}
              isLabelVisible={false}
              bgColor="#DB0279"
              width="730px"
              height="5px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
