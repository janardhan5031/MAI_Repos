import React, { useEffect, useState, useRef } from "react";
import Icons from "../Icons";
import moment from "moment";
import ChatIndividuals from "./chatIndividuals";
import ChatEvents from "./chatEvents";
import Requests from "./Requests";
import OpenchatModel from "./OpenChatModel";
import { useSelector } from "react-redux";

const ChattPopover = (props: any) => {
  // state variable for current message in input box
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Individuals");
  const [openModel, setOpenModel] = useState(false);
  const [name, setName] = useState("Pullaya");
  const [AgoraId, setAgoraId] = useState("");
  const [profile, setProfile] = useState("");
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };
  const convertUTCToLocalTime = (UTCString) => {
    if (!UTCString) {
      return "";
    }
    const localTime = moment
      .utc(new Date(parseInt(UTCString)))
      .local()
      .format("HH:mm");
    return localTime;
  };
  // get user data from reducer
  const dataChannelReducer = useSelector(
    (Data: any) => Data.DataChannelReducer
  );
  const [chatData, setChatData] = useState([]);

  const [loading, setLoading] = useState(true);

  // sends message to agoraChat
  const sendMessage = () => {
    if (currentMessage.trim() == "") return;
    props?.chatConnection.send({
      chatType: "singleChat",
      type: "txt",
      msg: currentMessage,
      time: new Date().getTime(),
      id: props?.chatConnection.getUniqueId(),
      to: AgoraId,
      ext: {
        name: dataChannelReducer.firstName + " " + dataChannelReducer.lastName,
        _id: dataChannelReducer.userId,
      },
      success: function () {
        setChatData((prevChatData) => [
          ...prevChatData,
          {
            username: "You",
            time: convertUTCToLocalTime(new Date().getTime()),
            message: currentMessage,
            id: dataChannelReducer.userId,
          },
        ]);
        scrollToBottom();
      }, // For the definition of failure, the sdk will register the message id in the log for the backup process
    });
    setCurrentMessage("");
  };

  useEffect(() => {
    props?.chatConnection.listen({
      onTextMessage: (msg) => {
        if (msg.type === "groupchat") {
          props?.setGroupChatData((prevChatData) => [
            ...prevChatData,
            {
              username: msg.ext.name,
              time: convertUTCToLocalTime(msg.time),
              message: msg["data"],
              id: msg.ext._id,
            },
          ]);
          props?.setNotification(true);
          scrollToBottom();
        }
        if (msg.type === "chat") {
          if (msg.from === AgoraId) {
            setChatData((prevChatData) => [
              ...prevChatData,
              {
                username: msg.ext.name,
                time: convertUTCToLocalTime(msg.time),
                message: msg["data"],
                id: msg.ext._id,
              },
            ]);
          }
          props?.setprivateNotification(true);
          scrollToBottom();
        }
      },
    });
  }, [props?.chatConnection, AgoraId]);

  useEffect(() => {
    if (activeTab === "Event Chat" && props?.notification) {
      props?.setNotification(false);
      scrollToBottom();
    }
    if (
      (activeTab === "Individuals" &&
        props?.privateNotification &&
        openModel) ||
      (props?.privateNotification && openModel)
    ) {
      props?.setprivateNotification(false);
      scrollToBottom();
    }
    if (activeTab === "Requests" && props?.requestNotification) {
      props?.setrequestNotification(false);
    }
  }, [
    activeTab,
    props?.notification,
    props?.privateNotification,
    props?.requestNotification,
    openModel,
  ]);

  return (
    <>
      <div
        className={`mt-0 flex flex-col justify-end items-end absolute z-50 ${props.className}`}
      >
        <div
          className={`flex flex-col w-96 chat-glass-effect rounded-lg text-white animate-fadeIn`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col justify-center items-center pt-6 px-10 pb-0 gap-x-10 chat-glass-effect-header text-white rounded-tl-lg rounded-tr-lg">
            <div className="flex translate-x-[174px] -translate-y-3">
              <div
                className="cursor-pointer"
                onClick={() => {
                  props?.setSelectedPopover("");
                }}
              >
                <Icons variant="close" />
              </div>
            </div>
            <div className="flex gap-4">
              <span
                className={`flex items-center justify-center text-center w-28 cursor-pointer hover:border-b-2 hover:border-x-white pb-2 ${
                  activeTab === "Individuals" || openModel
                    ? "border-b-2 border-x-white font-bold"
                    : "font-medium"
                }`}
                onClick={() => {
                  setActiveTab("Individuals");
                }}
              >
                <span>Private</span>
                {props?.privateNotification && (
                  <span className="h-2 w-2 bg-red-500 rounded-full inline-block ml-2"></span>
                )}
              </span>
              <span
                className={`flex items-center justify-center text-center w-28 cursor-pointer hover:border-b-2 hover:border-x-white pb-2 ${
                  activeTab === "Event Chat"
                    ? "border-b-2 border-x-white font-bold"
                    : "font-medium"
                }`}
                onClick={() => {
                  setActiveTab("Event Chat");
                  setOpenModel(false);
                }}
              >
                <span>Global</span>
                {props?.notification && (
                  <span className="h-2 w-2 bg-red-500 rounded-full inline-block ml-2"></span>
                )}
              </span>
              <span
                className={`flex items-center justify-center text-center w-28 cursor-pointer hover:border-b-2 hover:border-x-white pb-2 ${
                  activeTab === "Requests"
                    ? "border-b-2 border-x-white font-bold"
                    : "font-medium"
                }`}
                onClick={() => {
                  setActiveTab("Requests");
                  setOpenModel(false);
                }}
              >
                <span>Requests</span>
                {props?.requestNotification && (
                  <span className="h-2 w-2 bg-red-500 rounded-full inline-block ml-2"></span>
                )}
              </span>
            </div>
          </div>
          {openModel && (
            <OpenchatModel
              setOpenModel={setOpenModel}
              setActiveTab={setActiveTab}
              loading={loading}
              chatindividualData={chatData}
              setCurrentMessage={setCurrentMessage}
              messagesEndRef={messagesEndRef}
              currentMessage={currentMessage}
              sendMessage={sendMessage}
              name={name}
              profile={profile}
            />
          )}
          {activeTab === "Individuals" && (
            <ChatIndividuals
              setOpenModel={setOpenModel}
              setActiveTab={setActiveTab}
              setName={setName}
              setAgoraId={setAgoraId}
              convertUTCToLocalTime={props?.convertUTCToLocalTime}
              chatConnection={props?.chatConnection}
              setIndividualChatData={setChatData}
              chatindividualData={chatData}
              setLoading={setLoading}
              setProfile={setProfile}
            />
          )}
          {activeTab === "Event Chat" && (
            <ChatEvents
              loading={props?.spinloading}
              chatData={props?.chatData}
              setCurrentMessage={props?.setCurrentMessage}
              messagesEndRef={props?.messagesEndRef}
              currentMessage={props?.currentMessage}
              sendMessage={props?.sendMessage}
              setNumberofChats={props?.setNumberofChats}
              numberofchats={props?.numberofchats}
              loginUser={props?.loginUser}
              groupId={props?.groupId}
              chatConnection={props?.chatConnection}
              setChatData={props?.setGroupChatData}
              convertUTCToLocalTime={props?.convertUTCToLocalTime}
              setNotification={props?.setNotification}
            />
          )}
          {activeTab === "Requests" && (
            <Requests
              chatConnection={props?.chatConnection}
              setStatus={props?.setStatus}
              setPersonName={props?.setPersonName}
              setPersonAvatar={props?.setPersonAvatar}
              setrequestNotification={props?.setrequestNotification}
              requestNotification={props?.requestNotification}
              setuserIdd={props?.setuserIdd}
              setAgorIDD={props?.setAgorIDD}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ChattPopover;
