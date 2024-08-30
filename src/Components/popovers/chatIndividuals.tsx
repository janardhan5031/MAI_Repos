import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { friendList } from "../../Graphql/queries";
import mai from "../../assets/mai_logo.png";
import DummyProfile from "../../assets/DummyProfile.png";
import { useSelector } from "react-redux";
import InfiniteScroll from "react-infinite-scroll-component";
import { CONFIG } from "../../config";

interface ChatIndividualsProps {
  setOpenModel?: any;
  setActiveTab?: any;
  setName?: any;
  setAgoraId?: any;
  chatConnection?: any;
  convertUTCToLocalTime?: any;
  setIndividualChatData?: any;
  chatindividualData?: any;
  setLoading?: any;
  setProfile?: any;
}

const ChatIndividuals: React.FC<ChatIndividualsProps> = ({
  setOpenModel,
  setActiveTab,
  setName,
  setAgoraId,
  convertUTCToLocalTime,
  chatConnection,
  setIndividualChatData,
  chatindividualData,
  setLoading,
  setProfile,
}) => {
  const [searchName, setSearchName] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [chatIndividual, setChatIndividual] = useState(null);
  const User = useSelector((data: any) => data?.LoginReducer);
  const scrollableDivRef: any = useRef<HTMLDivElement>(null);
  const [lastMessages, setLastMessages] = useState({});

  const {
    data: chatIndividuals,
    loading,
    fetchMore,
  } = useQuery(friendList, {
    context: {
      headers: {
        accessToken: `${User?.access_token}`,
      },
    },
    fetchPolicy: "no-cache",
    variables: {
      paginationInput: {
        limit: 5,
        page: activePage,
      },
      username: "",
    },
  });

  const [dataLoading, setDataloading] = useState(true);

  useEffect(() => {
    if (chatIndividuals) {
      setChatIndividual((previous) => {
        if (previous && activePage > 1) {
          // Concatenate the previous state with the new data
          return [...previous, ...chatIndividuals?.friendList?.list];
        } else {
          // If previous state is null or undefined, return the new data
          return chatIndividuals?.friendList?.list;
        }
      });
    }
  }, [chatIndividuals]);

  const hanldeClick = (individual) => {
    setOpenModel(true);
    setActiveTab("");
    setName(individual?.agoraUsername);
    setAgoraId(individual?.agoraId);
    if (
      individual?.avatarGender?.toUpperCase() === "F" ||
      individual?.avatarGender?.toUpperCase() === "FEMALE"
    ) {
      setProfile(CONFIG?.FEMALE_AVATAR);
    } else {
      setProfile(CONFIG?.MALE_AVATAR);
    }
    setLoading(true);
    chatConnection
      .getHistoryMessages({
        targetId: individual?.agoraId,
        chatType: "singleChat",
        pageSize: 400,
        searchDirection: "down",
        searchOptions: {},
      })
      .then((res: any) => {
        setIndividualChatData(
          res?.messages?.map((message: any) => ({
            username: message.ext.name,
            time: convertUTCToLocalTime(message.time),
            message: message.msg,
            id: message.ext._id,
          }))
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    // Fetch history messages for all individuals when component mounts
    const fetchHistoryMessages = async () => {
      const promises = chatIndividual?.map((individual) =>
        chatConnection.getHistoryMessages({
          targetId: individual.agoraId,
          chatType: "singleChat",
          pageSize: 200,
          searchDirection: "down",
          searchOptions: {},
        })
      );

      try {
        const responses = await Promise.all(promises);
        const chatData = responses.map((res) => {
          return res?.messages?.map((message) => ({
            username: message.ext.name,
            time: convertUTCToLocalTime(message.time),
            message: message.msg,
            id: message.ext._id,
          }));
        });
        setIndividualChatData(chatData);
        setDataloading(false);
      } catch (error) {
        console.error("", error);
      }
    };

    fetchHistoryMessages();
  }, [chatIndividual, chatConnection, convertUTCToLocalTime, fetchMore]);

  useEffect(() => {
    if (chatindividualData.length > 0 && chatIndividual) {
      const updatedMessages = {};
      chatIndividual.forEach((individual, index) => {
        updatedMessages[individual.userId] =
          chatindividualData[index]?.[chatindividualData[index]?.length - 1]
            ?.message || "";
      });
      setLastMessages(updatedMessages);
    }
  }, [chatindividualData, chatIndividual]);

  const totalNumberOfPages = Math.ceil(
    chatIndividuals?.friendList?.totaCount / 5
  );

  const fetchMoreData = () => {
    setActivePage((prevActivePage) => prevActivePage + 1);
  };

  return (
    <>
      <div className="p-4 border-b-[1px] border-[#D9D9D9] border-opacity-20 flex items-center justify-center">
        <div>
          <input
            type="text"
            className="p-3 min-w-[320px] rounded-xl text-lg placeholder:text-white focus:outline-none text-white"
            placeholder="Search individual"
            onChange={(e) => {
              e.preventDefault();
              setSearchName(e.target.value);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            style={{ background: "rgba(0, 0, 0, 0.2)" }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4 h-[365px] overflow-y-hidden">
        <div className="font-bold text-lg">Your Friends</div>
        <div
          className="flex flex-col overflow-y-auto scrollable-div"
          ref={scrollableDivRef}
        >
          {dataLoading ? (
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
          ) : chatIndividual &&
            chatIndividual?.filter((individual) =>
              individual?.agoraUsername
                ?.toLowerCase()
                ?.includes(searchName.toLowerCase())
            )?.length > 0 ? (
            <InfiniteScroll
              dataLength={chatIndividuals?.friendList?.totaCount}
              next={fetchMoreData}
              hasMore={activePage < totalNumberOfPages}
              loader={<></>}
              scrollableTarget={scrollableDivRef.current}
            >
              {chatIndividual
                ?.filter((individual) =>
                  individual?.agoraUsername
                    ?.toLowerCase()
                    ?.includes(searchName?.toLowerCase())
                )
                ?.map((individual, index) => (
                  <div
                    key={index}
                    className="flex gap-5 items-center py-4 border-b-[1px] border-[#D9D9D9] border-opacity-20 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      hanldeClick(individual);
                    }}
                  >
                    <div>
                      <img
                        src={
                          individual?.avatarGender?.toUpperCase() === "F" ||
                          individual?.avatarGender?.toUpperCase() === "FEMALE"
                            ? CONFIG?.FEMALE_AVATAR
                            : CONFIG?.MALE_AVATAR
                        }
                        alt=""
                        className="h-10 w-10 rounded-full cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col w-72">
                      <div className="items-center text-white text-lg w-72 truncate">
                        {individual.agoraUsername}
                      </div>
                      <div className="flex justify-between">
                        <div className="w-40 truncate">
                          {lastMessages[individual.userId]}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </InfiniteScroll>
          ) : (
            <div className="mx-auto mt-28">{"Not found"}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatIndividuals;
