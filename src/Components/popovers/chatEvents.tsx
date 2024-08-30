import React, { useEffect, useState } from "react";
import Icons from "../Icons";
import event from "../../assets/event.png";
import mai from "../../assets/mai_logo.png";
import { useSelector } from "react-redux";
interface chatEvent {
  loading?: any;
  chatData?: any;
  setCurrentMessage?: any;
  messagesEndRef?: any;
  currentMessage?: any;
  sendMessage?: any;
  setNumberofChats?: any;
  numberofchats?: any;
  loginUser?: any;
  groupId?: any;
  setChatData?: any;
  convertUTCToLocalTime?: any;
  setNotification?: any;
  chatConnection?: any;
}

const chatEvents: React.FC<chatEvent> = ({
  loading,
  chatData,
  setCurrentMessage,
  messagesEndRef,
  currentMessage,
  sendMessage,
  setNumberofChats,
  numberofchats,
  loginUser,
  groupId,
  setChatData,
  convertUTCToLocalTime,
  setNotification,
  chatConnection,
}) => {
  // state variable for current message in input box
  const [loadingTop, setLoadingTop] = useState(false);
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
    const fetchHistoryMessages = async () => {
      const promises = chatConnection.getHistoryMessages({
        targetId: groupId,
        chatType: "groupChat",
        pageSize: 200,
        searchDirection: "down",
        searchOptions: {},
      });

      try {
        const responses = await Promise.all(promises);
        const chatindividualData = responses.map((res) => {
          return res?.messages?.map((message) => ({
            username: message.ext.name,
            time: convertUTCToLocalTime(message.time),
            message: message.msg,
            id: message.ext._id,
          }));
        });
        setChatData((prevChatData) => [...prevChatData, chatindividualData]);
      } catch (error) {
        console.error("", error);
      }
    };

    fetchHistoryMessages();
  }, [chatConnection]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
      setNotification(false);
    }
  }, [loading]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;

    if (scrollTop === 0 && scrollTop < clientHeight && !loadingTop) {
      setLoadingTop(true);
      setNumberofChats(numberofchats + 10);
      if (!chatConnection && loadingTop) {
        loginUser().then(() => {
          chatConnection
            .getHistoryMessages({
              targetId: groupId,
              chatType: "groupChat",
              pageSize: 10,
              searchDirection: "down",
              searchOptions: {},
            })
            .then((res) => {
              setChatData((prevChatData) => [
                ...prevChatData,
                ...res?.messages?.map((message: any) => ({
                  username: message.ext.name,
                  time: convertUTCToLocalTime(message.time),
                  message: message.msg,
                  id: message.ext._id,
                })),
              ]);
            });
          chatConnection.listen({
            onTextMessage: (msg) => {
              setChatData((prevChatData) => [
                ...prevChatData,
                {
                  username: msg.ext.name,
                  time: convertUTCToLocalTime(msg.time),
                  message: msg["data"],
                  id: msg.ext._id,
                },
              ]);
              setNotification(true);
            },
            onTokenWillExpire: () => {
              loginUser();
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
    <>
      <div
        className="p-4 h-[394px] overflow-y-auto scrollable-div"
        onScroll={handleScroll}
      >
        {loadingTop && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center mt-2">
            <div className="w-8 h-8 border-t-4 border-r-4 border-solid border-gray-500 animate-spin rounded-full mt-36"></div>
          </div>
        )}
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
          <div className={`${loadingTop ? "py-12" : ""}`}>
            {chatData.map((chat, index) => {
              if (chat.id === dataChannelReducer?.userId) {
                return (
                  <div
                    className={`flex flex-col bg-white bg-opacity-20 ${
                      index != chatData.length - 1 ? "mb-4" : ""
                    } p-2 rounded-md w-1/2 ml-44`}
                    key={index}
                  >
                    <span className="text-white font-semibold text-sm">
                      {"You"}
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
                  <div className="flex flex-col chat-message-glass-effect mb-4 p-2 rounded-md w-1/2">
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

export default chatEvents;
