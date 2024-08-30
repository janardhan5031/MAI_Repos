import React, { useEffect, useState } from "react";
import event from "../../assets/event.png";
import Icons from "../Icons";
import mai from "../../assets/mai_logo.png";
import AC, { AgoraChat } from "agora-chat";
import { CONFIG } from "../../config";

const ChatPopover = (props: any) => {
  // state variable for current message in input box
  const [loadingTop, setLoadingTop] = useState(false);
  const [chatConnection, setchatConnection] =
    useState<AgoraChat.Connection>(null);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;

    if (scrollTop === 0 && scrollTop < clientHeight && !loadingTop) {
      setLoadingTop(true);
      props?.setNumberofChats(props?.numberofchats + 10);
      if (!chatConnection && loadingTop) {
        let connection = new AC.connection({
          appKey: CONFIG.AGORA_APP_KEY,
        });
        setchatConnection(connection);
        props?.loginUser().then(() => {
          chatConnection
            .getHistoryMessages({
              targetId: props?.groupId,
              chatType: "groupChat",
              pageSize: 10,
              searchDirection: "down",
              searchOptions: {},
            })
            .then((res) => {
              props?.setChatData((prevChatData) => [
                ...prevChatData,
                ...res?.messages?.map((message: any) => ({
                  username: message.ext.name,
                  time: props?.convertUTCToLocalTime(message.time),
                  message: message.msg,
                })),
              ]);
            });
          chatConnection.listen({
            onTextMessage: (msg) => {
              props?.setChatData((prevChatData) => [
                ...prevChatData,
                {
                  username: msg.ext.name,
                  time: props?.convertUTCToLocalTime(msg.time),
                  message: msg["data"],
                },
              ]);
              props?.setNotification(true);
            },
            onTokenWillExpire: () => {
              props?.loginUser();
            },
          });
        });
      }

      setTimeout(() => {
        setLoadingTop(false);
      }, 1000);
    }
  };

  return (
    <div
      className={`mt-6 flex flex-col justify-end items-end absolute z-50 ${props.className}`}
    >
      <div
        className={`flex flex-col w-72 chat-glass-effect rounded-lg text-white animate-fadeIn`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center items-center p-4 gap-x-3 chat-glass-effect-header text-white rounded-tl-lg rounded-tr-lg">
          <span className="font-medium">Event Chat</span>
        </div>
        <div className="p-4 border-b-[1px] border-[#D9D9D9] border-opacity-20">
          <div className="flex gap-x-3 items-center">
            <img src={event} alt="" />
            <span className="font-semibold text-sm">POPS Event</span>
          </div>
        </div>
        <div
          className="p-4 h-[250px] overflow-y-auto scrollable-div relative"
          onScroll={handleScroll}
        >
          {loadingTop && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center mt-2">
              <div className="w-8 h-8 border-t-4 border-r-4 border-solid border-gray-500 animate-spin rounded-full"></div>
            </div>
          )}
          {props?.spinloading && (
            <div className="flex items-center justify-center mt-16">
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
          {!props?.spinloading && (
            <div className={`${loadingTop ? "py-12" : ""}`}>
              {props?.chatData.map((chat, index) => {
                if (chat.username === "You") {
                  return (
                    <div
                      className={`flex flex-col bg-white bg-opacity-20 ${
                        index != props?.chatData.length - 1 ? "mb-4" : ""
                      } p-2 rounded-md`}
                      key={index}
                    >
                      <span className="text-white font-semibold text-sm">
                        {chat.username}
                      </span>
                      <div className="flex justify-between items-end">
                        <span className="text-white font-normal text-sm break-all">
                          {chat.message}
                        </span>
                        <span className="text-white text-[10px] font-normal">
                          {chat.time}
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex flex-col chat-message-glass-effect mb-4 p-2 rounded-md">
                      <span className="text-white font-semibold text-sm">
                        {chat.username}
                      </span>
                      <div className="flex justify-between items-end">
                        <span className="text-white font-normal text-sm break-all">
                          {chat.message}
                        </span>
                        <span className="text-white text-[10px] font-normal">
                          {chat.time}
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
          <div ref={props?.messagesEndRef}></div>
        </div>
        <div className="px-4 py-2">
          <input
            type="text"
            className="p-2 rounded-md w-full chat-message-glass-effect pr-12"
            placeholder="Type your message here"
            onChange={(e) => props?.setCurrentMessage(e.target.value)}
            disabled={props?.spinloading}
            value={props?.currentMessage}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                props?.sendMessage();
              }
            }}
          />
          <div
            className="p-2 bg-white bg-opacity-20 absolute bottom-3 right-5 rounded-md"
            onClick={props?.sendMessage}
          >
            <Icons variant="send" className="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPopover;
