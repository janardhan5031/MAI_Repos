import React, { useEffect, useRef, useState } from "react";
import Button from "../Components/Button";
import ControlsPopover from "../Components/popovers/ControlsPopover";
import ChatPopover from "../Components/popovers/ChatPopover";
import CartPopover from "../Components/popovers/CartPopover";
import DanceMovesPopover from "../Components/popovers/DanceMovesPopover";
import PlayerComponent from "../Components/PlayerComponent";
import EmojisPopover from "../Components/popovers/EmojisPopover";
import EmojiConfetti from "../Components/EmojiConfetti";
import { CONFIG } from "../config";
import { LOGIN } from "../Components/ConstantLinks";
import { store } from "../Store";
import axios from "axios";
import ConfirmationModal from "../Components/Modals/ConfirmationModal";
import { useSelector } from "react-redux";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  artistLatestTimeSlot,
  killUserSession,
  validateAccessToken,
} from "../Graphql/queries";
import Timer from "../Components/Timer";
import {
  addUserToChatGroup,
  refreshToken,
  registerAgoraUser,
} from "../Graphql/mutations";
import { ReactInternetSpeedMeter } from "react-internet-meter";
import "../../node_modules/react-internet-meter/dist/index.css";
import ClosingModel from "../Components/Modals/ClosingModel";
import mai from "../assets/mai_logo.png";
import Icons from "../Components/Icons";
import moment from "moment";
import AC, { AgoraChat } from "agora-chat";
import ChattPopover from "../Components/popovers/peerchatPopover";
import ChatPopUpModel from "../Components/Modals/ChatPopUpModel";

const useBeforeUnload = () => {
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      console.log("Before unload event triggered");
      event.preventDefault();
      event.returnValue = "";
    };

    const handleUnload = () => {
      console.log("unloaded...");
      store.dispatch({
        type: "userLoggedOut",
      });
      //killUserSession()
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};

const Home = () => {
  useBeforeUnload();
  const [selectedPopover, setSelectedPopover] = useState("nothing");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState({
    emoji: "",
    id: 0,
  });
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [mute, setMute]: any = useState();
  const [micOn, setMicOn]: any = useState(false);
  const [showTime, setshowTime]: any = useState(false);
  const [checkSpeed, SetCheckSpeed] = React.useState("Finding internet speed.");

  const [showCapture, setshowCapture]: any = useState(false);
  const User = useSelector((data: any) => data?.LoginReducer);
  const artistSlotTiming = useSelector((Data: any) => Data?.artistTimeSlots);
  const artisteventId = useSelector((data: any) => data?.DataChannelReducer);
  const [GetTimeSlot] = useLazyQuery(artistLatestTimeSlot);
  const [VideoStarted, setVideoStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  const [showerrorMessage, setshowerrorMessage] = useState("");
  const [notification, setNotification] = useState(false);
  const [status, setStatus] = useState("");
  const [PersonName, setPersonName] = useState("Mr.Mac");
  const [personAvatar, setPersonAvatar] = useState("");
  const [isvalidtimeSolt, setValidtimesolt] = useState(false);
  const [privateNotification, setprivateNotification] = useState(false);
  const [requestNotification, setrequestNotification] = useState(false);
  const [AgorIDD, setAgorIDD] = useState("");
  const [userIdd, setuserIdd] = useState("");

  const [killArtistSession] = useLazyQuery(killUserSession, {
    fetchPolicy: "no-cache",
  });

  const queryParams = Object?.fromEntries(
    new URLSearchParams(location?.search)
  );

  const callMyDisconnect = () => {
    if ((window as any).myDisconnectFunction) {
      (window as any).myDisconnectFunction();
    } else {
      console.log("myDisconnectFunction");
    }
  };

  const callMyPlayFunction = () => {
    if ((window as any).myNewPlayFunction) {
      (window as any).myNewPlayFunction();
    } else {
      console.log("codecPreferences");
    }
  };

  setInterval(() => {
    const codecPreferences = document.getElementById("codecPreferences");
    const lockMouseCheck = document.getElementById("lockMouseCheck");

    if (codecPreferences && lockMouseCheck) {
      const CodecConst = window
        .getComputedStyle(codecPreferences)
        .getPropertyValue("display");
      const lockMouseConst = window
        .getComputedStyle(lockMouseCheck)
        .getPropertyValue("display");

      if (CodecConst === lockMouseConst) {
        if (lockMouseConst === "inline-block") {
          window.location.reload();
          callMyPlayFunction();
          console.log(lockMouseConst, "Reloaded");
        }
      }
    }
  }, 1000);

  const {
    data: ValidateAccessToken,
    loading,
    refetch,
  } = useQuery(validateAccessToken, {
    variables: {
      eventId: artisteventId?.eventId,
      sessionToken: User?.sessionToken,
    },
    fetchPolicy: "no-cache",
    pollInterval: 20 * 1000,
  });

  const [RefreshToken] = useMutation(refreshToken, {
    fetchPolicy: "no-cache",
  });

  const closePopover = (e: any) => {
    // e.stopPropagation();

    if (
      !e.target.closest(".custom-popover") &&
      !e.target.closest(".custom-btn-class")
    ) {
      setSelectedPopover("nothing");
    }
  };
  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  function exitHandler() {
    if (!document.fullscreenElement) setIsFullscreen(false);
  }

  useEffect(() => {
    // Attach the event listener when the component mounts
    document.addEventListener("mousedown", closePopover);
    document.addEventListener("fullscreenchange", exitHandler);

    // Detach the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", closePopover);
      document.addEventListener("fullscreenchange", exitHandler);
    };
  }, []);

  const buttonGroup = [
    {
      variant: "dance",
      value: "danceMoves",
    },
    {
      variant: "happy-face",
      value: "emojis",
    },
    {
      variant: `${
        notification || privateNotification || requestNotification
          ? "notificationIcon"
          : "chat"
      }`,
      value: "chat",
    },
  ];

  setInterval(() => {
    // setVideoStarted(true);
    const videoPlayer: any = document.getElementById("Video");

    if (videoPlayer instanceof HTMLVideoElement) {
      if (!videoPlayer.paused) {
        setVideoStarted(true);
      } else {
        setVideoStarted(false);
      }
    } else {
      setVideoStarted(false);
    }
  }, 1000);

  const handleMute = () => {
    const video: any = document.getElementById("Video");
    if (video?.muted == false) {
      video.muted = true;
      setMute(false);
    } else {
      video.muted = false;
      setMute(true);
    }
  };

  const handleMic = () => {
    setMicOn(!micOn);
  };

  const handleExit = () => {
    callMyDisconnect();
    killSession();
    store.dispatch({
      type: "LOGOUT",
    });

    if (User?.roles[0] === "EVENT_ATTENDEE")
      window.location.href = CONFIG.ATTENDEE_LINK;
    else if (
      User?.roles[0] === "EVENT_ORGANIZER" ||
      User?.roles[0] === "EVENT_ADVERTISER" ||
      User?.roles[0] === "EVENT_ARTIST"
    )
      window.location.href = CONFIG.ORG_LINK + LOGIN;
    else if (User?.roles[0] === "EVENT_VENDOR")
      window.location.href = CONFIG.VENDOR_LINK + LOGIN;
  };

  const handleKeyfPress = (event) => {
    setshowCapture(!showCapture);
    new KeyboardEvent("keydown", {
      key: "f",
      keyCode: 70,
      which: 70,
      code: "KeyF",
      location: 0,
    });
  };

  const handleKeycPress = (event) => {
    new KeyboardEvent("keydown", {
      key: "c",
      keyCode: 70,
      which: 70,
      code: "KeyC",
      location: 0,
    });
  };

  const killSession = () => {
    killArtistSession({
      context: {
        headers: {
          Authorization: `Bearer ${queryParams.accessToken}`,
        },
      },
    });
  };

  useEffect(() => {
    if (ValidateAccessToken?.validateAccessToken?.isValidTimeSlot === false) {
      setValidtimesolt(true);
    }

    if (
      ValidateAccessToken?.validateAccessToken?.eventExists === false ||
      ValidateAccessToken?.validateAccessToken?.isSessionTokenValid === false
    ) {
      handleExit();
    }

    if (
      (ValidateAccessToken?.validateAccessToken?.isAccessTokenValid ===
        undefined ||
        ValidateAccessToken?.validateAccessToken?.isAccessTokenValid ===
          null) &&
      ValidateAccessToken
    ) {
      RefreshToken({
        context: {
          headers: {
            refresh_token: `${User?.refresh_token}`,
          },
        },
      })
        .then((Data) => {
          if (Data?.data?.refreshToken) {
            store.dispatch({
              type: "setLogin",
              payload: {
                data: {
                  ...User,
                  access_token: Data?.data?.refreshToken?.access_token,
                  refresh_token: Data?.data?.refreshToken?.refresh_token,
                },
              },
            });
          }
        })
        .catch((err) => console.log(err));
    }

    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch, ValidateAccessToken]);

  useEffect(() => {
    if (User?.roles?.length > 0 && User?.roles?.includes("EVENT_ARTIST")) {
      GetTimeSlot({
        variables: {
          eventId: artisteventId?.eventId,
        },
        fetchPolicy: "no-cache",
      })
        .then((Data) => {
          if (Data?.data?.artistLatestTimeSlot?.length > 0) {
            store.dispatch({
              type: "setTimeSlots",
              payload: {
                data: Data?.data?.artistLatestTimeSlot[0],
              },
            });
          }
        })
        .catch((err) => console.log(err));
    }
  }, [User]);

  const fetchData = () => {
    axios({
      method: "get",
      url:
        store.getState().DataChannelReducer?.venueName === "HOE"
          ? `https://${CONFIG.SIGNELLING_SERVER_HOE}/health-check`
          : `https://${CONFIG.SIGNELLING_SERVER_HOP}/health-check`,
    })
      .then((Data) => {
        if (Data?.data?.statusCode === 500) {
          setErrorMessage(true);
          setshowerrorMessage("Preparing event for you. Hold tight!");
        } else if (Data?.data?.statusCode === 502) {
          setErrorMessage(true);
          setshowerrorMessage("Please wait! Your turn's coming.");
        } else if (Data?.data?.statusCode === 503) {
          setErrorMessage(true);
          setshowerrorMessage("Almost there! Thanks for waiting!");
        } else if (Data?.data?.statusCode === 200) {
          setErrorMessage(false);
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const customAvatar = useSelector((Data: any) => Data?.CustomAvatar);

  const [currentMessage, setCurrentMessage] = useState("");
  const [registerUserQuery] = useMutation(registerAgoraUser, {
    fetchPolicy: "no-cache",
  });
  const [groupId, setGroupId] = useState("");
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };
  const handleScroll = () => {
    if (messagesEndRef.current) {
      const isAtTop = messagesEndRef.current.getBoundingClientRect().top >= 0;
      setIsScrollingUp(!isAtTop);
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
  const [numberofchats, setNumberofChats] = useState(200);
  // get user data from reducer
  const dataChannelReducer = useSelector(
    (Data: any) => Data?.DataChannelReducer
  );
  const [addUserToChatGroupQuery] = useMutation(addUserToChatGroup, {
    fetchPolicy: "no-cache",
    variables: {
      eventId: dataChannelReducer.eventId,
    },
  });
  const [chatData, setGroupChatData] = useState([]);
  const [chatConnection, setchatConnection] =
    useState<AgoraChat.Connection>(null);
  const [spinloading, setspinLoading] = useState(true);
  // listen to messages from group
  useEffect(() => {
    if (!chatConnection) {
      let connection = new AC.connection({
        appKey: CONFIG.AGORA_APP_KEY,
      });
      setchatConnection(connection);
    }
  }, []);
  useEffect(() => {
    setspinLoading(true);
    if (chatConnection != null) {
      registerUserQuery({
        context: {
          headers: {
            accessToken: `${User?.access_token}`,
          },
        },
      })
        .then((res) => {
          addUserToChatGroupQuery({
            context: {
              headers: {
                accessToken: `${User?.access_token}`,
              },
            },
          })
            .then((response) => {
              setGroupId(response.data.addUserToChatGroup.groupId);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          addUserToChatGroupQuery({
            context: {
              headers: {
                accessToken: `${User?.access_token}`,
              },
            },
          })
            .then((response) => {
              setGroupId(response.data.addUserToChatGroup.groupId);
              loginUser().then(() => {
                setTimeout(() => setspinLoading(false), 2000);
                chatConnection
                  .getHistoryMessages({
                    targetId: response.data.addUserToChatGroup.groupId,
                    chatType: "groupChat",
                    pageSize: numberofchats,
                    searchDirection: "down",
                    searchOptions: {},
                  })
                  .then((res) => {
                    setGroupChatData((prevChatData) => [
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
                  onTokenWillExpire: () => {
                    loginUser();
                  },
                  onTextMessage: (msg: any) => {
                    if (msg.type === "groupchat") {
                      setNotification(true);
                    }
                    if (msg.type === "chat") {
                      setprivateNotification(true);
                    }
                  },
                });
              });
            })
            .catch((err) => {
              console.log(err);
            });
        });
    }
  }, [chatConnection]);
  useEffect(() => {
    if (!spinloading) {
      scrollToBottom();
      setNotification(false);
    }
  }, [spinloading]);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const scrollToBottomIfNeeded = () => {
    if (!isScrollingUp) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottomIfNeeded();
  }, [chatData, isScrollingUp]);

  const loginUser = () => {
    var options = {
      user: dataChannelReducer.userId.replace(/-/g, ""),
      pwd: "1234",
      appKey: CONFIG.AGORA_APP_KEY,
    };
    return chatConnection.open(options);
  };
  // sends message to agoraChat
  const sendMessage = () => {
    if (currentMessage.trim() == "") return;
    chatConnection.send({
      chatType: "groupChat",
      type: "txt",
      msg: currentMessage,
      time: new Date().getTime(),
      id: chatConnection.getUniqueId(),
      to: groupId,
      ext: {
        name: dataChannelReducer.firstName + " " + dataChannelReducer.lastName,
        _id: dataChannelReducer.userId,
      },
      success: function () {
        setGroupChatData((prevChatData) => [
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

  const isPortrait = window.innerHeight > window.innerWidth;

  return (
    <div className="relative w-screen h-screen">
      {isvalidtimeSolt && (
        <>
          <ConfirmationModal
            isOpen={isvalidtimeSolt}
            setModal={setValidtimesolt}
            title="You're not existing in this Time Solt"
          >
            <div className="flex items-center justify-center w-full gap-3 mt-0">
              <Button
                btnType={"primary-button"}
                disabled={false}
                className={"!bg-[#DB0279] !font-bold"}
                onClick={handleExit}
              >
                Logout
              </Button>
            </div>
          </ConfirmationModal>
        </>
      )}
      {isPortrait && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-80 text-white z-50">
          <p className="text-lg text-center">
            Please rotate your device to landscape mode for the best experience.
          </p>
        </div>
      )}
      {status !== "" ? (
        <ChatPopUpModel
          status={status}
          PersonName={PersonName}
          personAvatar={personAvatar}
          chatConnection={chatConnection}
          AgorIDD={AgorIDD}
          userIdd={userIdd}
          setrequestNotification={setrequestNotification}
        />
      ) : (
        <></>
      )}
      {confirmationModalOpen ? (
        <ConfirmationModal
          isOpen={confirmationModalOpen}
          setModal={setConfirmationModalOpen}
          title="Are you sure you want to Exit the event?"
        >
          <div className="flex items-center justify-center w-full gap-3 mt-0">
            <Button
              btnType={"primary-button"}
              disabled={false}
              className={"!bg-[#DB0279] !font-bold"}
              onClick={handleExit}
            >
              Exit
            </Button>
            <Button
              btnType={"primary-outline-button"}
              disabled={false}
              className={"!font-bold text-white"}
              onClick={() => {
                setConfirmationModalOpen(false);
              }}
            >
              No
            </Button>
          </div>
        </ConfirmationModal>
      ) : (
        <></>
      )}
      {confettiActive && <EmojiConfetti selectedEmoji={selectedEmoji} />}
      <>
        <>
          <div className="absolute z-20 flex gap-x-5 top-4 left-4">
            <div>
              <Button
                btnType="icon-button"
                variant="logout"
                className="button-glass-effect"
                active={false}
                onClick={() => setConfirmationModalOpen(true)}
              />
            </div>
            {User?.roles?.length > 0 &&
            User?.roles?.includes("EVENT_ARTIST") ? (
              <div>
                {
                  <Timer
                    startTime={new Date(artistSlotTiming?.startTime)}
                    endTime={new Date(artistSlotTiming?.endTime)}
                    setShowTimer={setshowTime}
                  />
                }
              </div>
            ) : (
              <div></div>
            )}
            <>
              {Number(checkSpeed) < 10.0 && Number(checkSpeed) >= 1.0 && (
                <div>
                  <Icons variant="slow_internet" className="" />
                </div>
              )}
              {Number(checkSpeed) < 1.0 && (
                <div>
                  <Icons variant="no_internet" className="" />
                </div>
              )}
            </>
          </div>
          <div className="absolute z-20 flex gap-x-10 top-4 right-4">
            <Button
              btnType="icon-button"
              variant={mute ? "unmute" : "mute"}
              className="text-white button-glass-effect"
              active={false}
              onClick={handleMute}
            ></Button>
            {/* {User?.roles?.length > 0 &&
              User?.roles?.includes("EVENT_ARTIST") &&
              showTime && (
                <Button
                  btnType="icon-button"
                  variant={micOn ? "mic-on" : "mic-off"}
                  className="text-white button-glass-effect"
                  active={false}
                  onClick={handleMic}
                ></Button>
              )} */}
            {User?.roles?.length > 0 &&
              User?.roles?.includes("EVENT_ATTENDEE") && (
                <CartPopover setSelectedPopover={setSelectedPopover} />
              )}
            <ControlsPopover setSelectedPopover={setSelectedPopover} />
            <Button
              btnType="icon-button"
              variant={isFullscreen ? "exit-fullscreen" : "expand"}
              className="button-glass-effect"
              active={false}
              onClick={handleFullScreen}
            />
          </div>
        </>
        {/* Button group */}
        <div className="absolute z-20 flex flex-col items-end justify-end top-28 right-4">
          <div className="flex flex-col items-center gap-4">
            <div
              className={`flex flex-col gap-y-3 p-2 px-[6px] rounded-full border-[1px] border-white relative button-group-glass-effect`}
            >
              {buttonGroup.map((btn, index) => (
                <Button
                  btnType="icon-button"
                  variant={btn.variant}
                  className={`!border-0 custom-btn-class ${
                    customAvatar && btn.variant == "dance" ? "hidden" : ""
                  }`}
                  onClick={() => {
                    setSelectedPopover((prevValue) =>
                      prevValue !== btn.value ? btn.value : "nothing"
                    );
                  }}
                  active={selectedPopover === btn?.value}
                  key={index}
                />
              ))}
            </div>
            {/* <div className="flex">
              <Button
                btnType="icon-button"
                variant={"camera"}
                className="text-white button-glass-effect"
                active={false}
                onClick={handleKeyfPress}
              ></Button>
            </div> */}
          </div>
          {selectedPopover === "emojis" && (
            <EmojisPopover
              className="custom-popover -top-2 right-20"
              setConfettiActive={setConfettiActive}
              setSelectedEmoji={setSelectedEmoji}
            />
          )}
          {selectedPopover === "chat" && (
            <ChattPopover
              className="custom-popover top-3 right-20"
              spinloading={spinloading}
              setSelectedPopover={setSelectedPopover}
              chatData={chatData}
              messagesEndRef={messagesEndRef}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              sendMessage={sendMessage}
              convertUTCToLocalTime={convertUTCToLocalTime}
              groupId={groupId}
              setspinLoading={setspinLoading}
              setNotification={setNotification}
              notification={notification}
              loginUser={loginUser}
              setNumberofChats={setNumberofChats}
              numberofchats={numberofchats}
              chatConnection={chatConnection}
              setGroupChatData={setGroupChatData}
              setPersonName={setPersonName}
              setPersonAvatar={setPersonAvatar}
              setStatus={setStatus}
              setprivateNotification={setprivateNotification}
              privateNotification={privateNotification}
              requestNotification={requestNotification}
              setrequestNotification={setrequestNotification}
              setuserIdd={setuserIdd}
              setAgorIDD={setAgorIDD}
            />
          )}

          {selectedPopover === "danceMoves" && customAvatar === false && (
            <DanceMovesPopover className="custom-popover -top-3 right-20" />
          )}
        </div>
      </>
      {errorMessage ? (
        <ClosingModel isOpen={errorMessage} setModal={setErrorMessage}>
          <div className="flex flex-col items-center justify-center w-screen h-full gap-y-5">
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
            <div className="text-xs font-semibold">{`${showerrorMessage}`}</div>
          </div>
        </ClosingModel>
      ) : !VideoStarted ? (
        <ClosingModel isOpen={!VideoStarted} setModal={setVideoStarted}>
          <div className="flex flex-col items-center justify-center w-screen h-full gap-y-5">
            <div className="relative w-20 h-20">
              <div
                className="inline-block h-20 w-20 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-[#DB0279] motion-reduce:animate-[loader_1.5s_linear_infinite]"
                role="status"
              ></div>
              <img
                src={mai}
                className="absolute w-10 transform -translate-x-1/2 -translate-y-1/2 inset-1/2"
                alt=""
              />
            </div>
            <div className="text-xs font-semibold">
              {"Please wait, your experience is loading..."}
            </div>
          </div>
        </ClosingModel>
      ) : (
        <></>
      )}
      <PlayerComponent />
      <ReactInternetSpeedMeter
        txtSubHeading=""
        outputType="empty"
        customClassName={null}
        txtMainHeading=""
        pingInterval={2000} // checks every 4 Seconds
        thresholdUnit="megabyte" // "byte" , "kilobyte", "megabyte"
        threshold={10}
        imageUrl={mai}
        downloadSize={"100000"}
        callbackFunctionOnNetworkDown={(speed) =>
          console.log(`Internet speed is down ${speed}`)
        }
        callbackFunctionOnNetworkTest={(speed) => {
          SetCheckSpeed(speed);
        }}
      />
    </div>
  );
};

export default Home;
