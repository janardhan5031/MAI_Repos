import React, { useEffect, useRef, useState } from "react";
import Icons from "../Icons";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
} from "../../Graphql/mutations";
import { agoraUserDetails, groupChatUser } from "../../Graphql/queries";
import mai from "../../assets/mai_logo.png";
import { useSelector } from "react-redux";
import InfiniteScroll from "react-infinite-scroll-component";
import { CONFIG } from "../../config";
import tick from "../../assets/tick.png";
interface Requests {
  chatConnection?: any;
  setStatus?: any;
  setPersonName?: any;
  setPersonAvatar?: any;
  setrequestNotification?: any;
  requestNotification?: any;
  setuserIdd?: any;
  setAgorIDD?: any;
}

const FriendRequests: React.FC<Requests> = ({
  chatConnection,
  setStatus,
  setPersonName,
  setPersonAvatar,
  setrequestNotification,
  requestNotification,
  setuserIdd,
  setAgorIDD,
}) => {
  const dataChannelReducer = useSelector(
    (Data: any) => Data?.DataChannelReducer
  );

  const User = useSelector((data: any) => data?.LoginReducer);
  const scrollableDivRef: any = useRef<HTMLDivElement>(null);

  const [searchName, setSearchName] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [Peoples, setPeoples] = useState(null);

  const {
    data: PeoplesList,
    loading,
    refetch,
  } = useQuery(groupChatUser, {
    context: {
      headers: {
        accessToken: `${User?.access_token}`,
      },
    },
    variables: {
      eventId: dataChannelReducer?.eventId,

      paginationInput: {
        limit: 5,
        page: activePage,
      },
      searchUser: "",
    },

    fetchPolicy: "no-cache",
  });

  const [sendFriendRequests] = useMutation(sendFriendRequest, {
    context: {
      headers: {
        accessToken: `${User?.access_token}`,
      },
    },
    fetchPolicy: "no-cache",
  });

  const [AcceptFriendRequests] = useMutation(acceptFriendRequest, {
    context: {
      headers: {
        accessToken: `${User?.access_token}`,
      },
    },
    fetchPolicy: "no-cache",
  });

  const [RejectFriendRequests] = useMutation(rejectFriendRequest, {
    context: {
      headers: {
        accessToken: `${User?.access_token}`,
      },
    },
    fetchPolicy: "no-cache",
  });

  const [agoraUserStatus] = useLazyQuery(agoraUserDetails, {
    fetchPolicy: "no-cache",
  });

  const sendfriendRequest = (userId, agoraId) => {
    chatConnection.addContact(agoraId, "message data here");
    sendFriendRequests({
      variables: {
        userId: userId,
      },
      fetchPolicy: "no-cache",
    })
      .then((res: any) => {
        console.log(res);
        setPeoples((prevPeoples) => {
          return prevPeoples.map((person) => {
            if (person.userId === userId) {
              return { ...person, friendStatus: "FRIEND_REQUEST_SENT" };
            } else {
              return person;
            }
          });
        });
        refetch();
      })
      .catch((err) => console.log(err));
  };

  const acceptfriendRequest = (userId, agoraId) => {
    chatConnection.acceptContactInvite(agoraId);
    AcceptFriendRequests({
      variables: {
        userId: userId,
      },
      fetchPolicy: "no-cache",
    })
      .then((res: any) => {
        console.log(res?.data?.acceptfriendRequest);
        setPeoples((prevPeoples) =>
          prevPeoples.filter((person) => person.userId !== userId)
        );
        refetch();
      })
      .catch((err) => console.log(err));
  };

  const rejectfriendRequest = (userId, agoraId) => {
    chatConnection.declineContactInvite(agoraId);
    RejectFriendRequests({
      variables: {
        userId: userId,
      },
      fetchPolicy: "no-cache",
    })
      .then((res: any) => {
        console.log(res?.data?.rejectFriendRequest);
        setPeoples((prevPeoples) =>
          prevPeoples.map((person) => {
            if (person.userId === userId) {
              return { ...person, friendStatus: "FRIEND_REQUEST_REJECTED" };
            } else {
              return person;
            }
          })
        );
        refetch();
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    if (PeoplesList) {
      setPeoples((previous) => {
        if (previous && activePage > 1) {
          // Concatenate the previous state with the new data

          return [...previous, ...PeoplesList?.groupChatUser[0]?.results];
        } else {
          // If previous state is null or undefined, return the new data

          return PeoplesList?.groupChatUser[0]?.results;
        }
      });
    }
  }, [PeoplesList]);

  useEffect(() => {
    chatConnection.addEventHandler(
      dataChannelReducer.userId.replace(/-/g, ""),
      {
        onContactAdded(msg) {
          console.log(msg, "dknckdn");
        },
      }
    );
  }, []);

  useEffect(() => {
    refetch();
  }, [dataChannelReducer?.eventId, searchName]);

  useEffect(() => {
    chatConnection.addEventHandler("CONTACT", {
      onContactInvited: function (msg) {
        console.log(msg, "experience Invited");
        if (dataChannelReducer?.userId?.replace(/-/g, "") === msg?.to) {
          setAgorIDD(msg?.from);
          agoraUserStatus({
            context: {
              headers: {
                accessToken: `${User?.access_token}`,
              },
            },
            variables: {
              agoraId: msg.from,
            },
          }).then((Data: any) => {
            setPersonName(Data?.data?.agoraUserDetails?.name);
            setPersonAvatar(Data?.data?.agoraUserDetails?.avatarGender);
            setuserIdd(Data?.data?.agoraUserDetails?.userId);
          });
          setrequestNotification(true);
          setStatus("Invited");
          refetch();
        }
      },
      // Occurs when the contact invitation is declined
      onContactRefuse: function (msg) {
        console.log(msg, "experience Refused");
        if (dataChannelReducer?.userId?.replace(/-/g, "") === msg?.to) {
          setAgorIDD(msg?.from);
          agoraUserStatus({
            context: {
              headers: {
                accessToken: `${User?.access_token}`,
              },
            },
            variables: {
              agoraId: msg.from,
            },
          }).then((Data: any) => {
            setPersonName(Data?.data?.agoraUserDetails?.name);
            setPersonAvatar(Data?.data?.agoraUserDetails?.avatarGender);
            setuserIdd(Data?.data?.agoraUserDetails?.userId);
          });
          setrequestNotification(true);
          setStatus("Rejected");
          refetch();
        }
      },
      // Occurs when the contact invitation is approved
      onContactAgreed: function (msg) {
        console.log(msg, "experience Agreed");
        if (dataChannelReducer?.userId?.replace(/-/g, "") === msg?.to) {
          setAgorIDD(msg?.from);
          agoraUserStatus({
            context: {
              headers: {
                accessToken: `${User?.access_token}`,
              },
            },
            variables: {
              agoraId: msg.from,
            },
          }).then((Data: any) => {
            setPersonName(Data?.data?.agoraUserDetails?.name);
            setPersonAvatar(Data?.data?.agoraUserDetails?.avatarGender);
            setuserIdd(Data?.data?.agoraUserDetails?.userId);
          });
          setrequestNotification(true);
          setStatus("Accepted");
          refetch();
        }
      },
    });
  }, [chatConnection, User, dataChannelReducer]);

  const totalNumberOfPages = Math.ceil(
    PeoplesList?.groupChatUser[0]?.total / 5
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
        <div className="font-bold text-lg">People</div>
        {loading && activePage === 1 ? (
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
        ) : (
          <div
            className="flex flex-col overflow-y-auto scrollable-div"
            ref={scrollableDivRef}
          >
            {Peoples &&
            Peoples?.filter((friend) =>
              friend?.agoraUsername
                ?.toLowerCase()
                ?.includes(searchName?.toLowerCase())
            )?.length > 0 ? (
              <InfiniteScroll
                dataLength={PeoplesList?.groupChatUser[0]?.total}
                next={fetchMoreData}
                hasMore={activePage < totalNumberOfPages}
                loader={<></>}
                scrollableTarget={scrollableDivRef.current}
              >
                {Peoples?.filter((friend) =>
                  friend?.agoraUsername
                    ?.toLowerCase()
                    ?.includes(searchName?.toLowerCase())
                )?.map((friend, index) => (
                  <div
                    className="flex items-center justify-between py-4 border-b-[1px] border-[#D9D9D9] border-opacity-20"
                    key={index}
                  >
                    <div className="flex items-center gap-5">
                      <div>
                        <img
                          src={
                            friend?.avatarGender?.toUpperCase() === "F" ||
                            friend?.avatarGender?.toUpperCase() === "FEMALE"
                              ? CONFIG?.FEMALE_AVATAR
                              : CONFIG?.MALE_AVATAR
                          }
                          alt=""
                          className="h-10 w-10 rounded-full cursor-not-allowed"
                        />
                      </div>
                      <div className="tooltip-container">
                        <div className="w-[145px] truncate font-semibold text-lg">
                          {friend?.agoraUsername}
                        </div>
                        {/* <div className="tooltip">{friend?.agoraUsername}</div> */}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        friend.friendStatus && friend.friendStatus !== ""
                          ? friend.friendStatus === "FRIEND_REQUEST_SENT"
                            ? "bg-[#45925F] cursor-not-allowed px-7 py-2 rounded-full"
                            : ""
                          : "bg-newPrimary px-7 py-2 rounded-full cursor-pointer"
                      }`}
                    >
                      {!friend.friendStatus ? (
                        <div
                          onClick={() =>
                            sendfriendRequest(friend.userId, friend.agoraId)
                          }
                          className="flex items-center gap-2 font-semibold"
                        >
                          <Icons variant={`request`} />
                          {`${"Request"}`}
                        </div>
                      ) : (
                        ""
                      )}
                      {friend.friendStatus === "FRIEND_REQUEST_REJECTED" ? (
                        <div className="font-semibold">Not Accepted</div>
                      ) : (
                        <></>
                      )}
                      {friend.friendStatus === "FRIEND_REQUEST_SENT" && (
                        <div className="flex items-center gap-2 font-semibold">
                          <img src={tick} alt="" />
                          {`${"Sent"}`}
                        </div>
                      )}
                      {friend.friendStatus === "FRIEND_INVITE_RECEIVED" && (
                        <div className="flex gap-2">
                          <div
                            className="flex items-center px-6 py-3 rounded-full bg-[#94a3b8] cursor-pointer font-semibold"
                            onClick={() =>
                              rejectfriendRequest(friend.userId, friend.agoraId)
                            }
                          >
                            <Icons variant="close" />
                          </div>
                          <div
                            className="flex items-center px-6 py-3 rounded-full bg-[#45925F] cursor-pointer font-semibold"
                            onClick={() =>
                              acceptfriendRequest(friend.userId, friend.agoraId)
                            }
                          >
                            <Icons variant="right" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </InfiniteScroll>
            ) : (
              <div className="mx-auto mt-28">{"Not found"}</div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FriendRequests;
