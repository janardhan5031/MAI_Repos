import React, { useEffect } from "react";
import Icons from "../Icons";
import mai from "../../assets/mai_logo.png";
import { useSelector } from "react-redux";
import DummyProfile from "../../assets/DummyProfile.png";

interface OpenchatModel {
  setOpenModel?: any;
  setActiveTab?: any;
  loading?: any;
  chatindividualData?: any;
  setCurrentMessage?: any;
  messagesEndRef?: any;
  currentMessage?: any;
  sendMessage?: any;
  name?: any;
  profile?: any;
}

const OpenchatModel: React.FC<OpenchatModel> = ({
  setOpenModel,
  setActiveTab,
  loading,
  chatindividualData,
  setCurrentMessage,
  messagesEndRef,
  currentMessage,
  sendMessage,
  name,
  profile,
}) => {
  const dataChannelReducer = useSelector(
    (Data: any) => Data?.DataChannelReducer
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, chatindividualData]);

  return (
    <>
      <div className="flex items-center p-4 border-b-[1px] border-[#D9D9D9] border-opacity-20 h-[85px]">
        <div className="flex gap-x-3 items-center">
          <div
            onClick={() => {
              setOpenModel(false);
              setActiveTab("Individuals");
            }}
            className="cursor-pointer"
          >
            <Icons variant="left-arrow" />
          </div>
          <div className="flex items-center gap-5">
            <div>
              <img
                src={profile || DummyProfile}
                alt=""
                className="h-10 w-10 rounded-full"
              />
            </div>
            <div className="flex items-center text-white text-lg w-40 truncate">
              {`${name}`}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 h-[309px] overflow-y-auto scrollable-div">
        {loading && (
          <div className="flex items-center justify-center mt-24">
            <div className="relative w-20 h-20">
              <div
                className="inline-block h-20 w-20 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-newPrimary motion-reduce:animate-[loader_1.5s_linear_infinite]"
                role="status"
              ></div>
              <img
                src={mai}
                className="absolute w-10 transform -translate-x-1/2 -translate-y-1/2 inset-1/2"
                alt=""
              />
            </div>
          </div>
        )}
        {!loading && (
          <div>
            {chatindividualData.map((chat, index) => {
              if (chat.id === dataChannelReducer?.userId) {
                return (
                  <div
                    className={`flex flex-col bg-white bg-opacity-20 ${
                      index != chatindividualData.length - 1 ? "mb-4" : ""
                    } p-2 rounded-md w-1/2 ml-44`}
                  >
                    <div className="flex flex-col justify-between items-start">
                      <span className="text-white font-normal text-sm break-all">
                        {chat.message}
                      </span>
                      <span className="text-white text-[10px] font-normal break-all ml-32">
                        {chat.time}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col chat-message-glass-effect mb-4 p-2 rounded-md w-1/2">
                    <div className="flex flex-col justify-between items-start">
                      <span className="text-white font-normal text-sm break-all">
                        {chat.message}
                      </span>
                      <span className="text-white text-[10px] font-normal ml-32">
                        {chat.time}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="px-4 py-2">
        <input
          type="text"
          className="p-2 rounded-md w-full chat-message-glass-effect pr-12 placeholder:text-white"
          placeholder="Type your message here"
          onChange={(e) => setCurrentMessage(e.target.value)}
          disabled={loading}
          value={currentMessage}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />
        <div
          className="p-2 bg-white bg-opacity-20 absolute bottom-3 right-5 rounded-md"
          onClick={() => {
            sendMessage();
          }}
        >
          <Icons variant="send" className="" />
        </div>
      </div>
    </>
  );
};

export default OpenchatModel;
