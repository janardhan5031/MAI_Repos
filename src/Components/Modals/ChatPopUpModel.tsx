import Button from "../Button";
import DummyProfile from "../../assets/DummyProfile.png";
import { useEffect, useState } from "react";
import Accept from "../../assets/Check.svg";
import Decline from "../../assets/decline.svg";
import { useSelector } from "react-redux";
import { useMutation } from "@apollo/client";
import {
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../Graphql/mutations";
import { Toaster, toast } from "sonner";

const ChatPopUpModel = (props: any) => {
  const User = useSelector((data: any) => data?.LoginReducer);
  const [showToast, setShowToast] = useState(false);

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

  const acceptfriendRequest = (userId, agoraId) => {
    props?.chatConnection.acceptContactInvite(agoraId);
    AcceptFriendRequests({
      variables: {
        userId: userId,
      },
      fetchPolicy: "no-cache",
    })
      .then((res: any) => {
        console.log(res?.data?.acceptfriendRequest);
        props?.setrequestNotification(false);
        setShowToast(true);
      })
      .catch((err) => console.log(err));
  };

  const rejectfriendRequest = (userId, agoraId) => {
    props?.chatConnection.declineContactInvite(agoraId);
    RejectFriendRequests({
      variables: {
        userId: userId,
      },
      fetchPolicy: "no-cache",
    })
      .then((res: any) => {
        console.log(res?.data?.rejectFriendRequest);
        props?.setrequestNotification(false);
        setShowToast(true);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    if (props?.status === "Invited") {
      {
        toast(
          <div className="flex items-center gap-2">
            <img src={props?.personAvatar || DummyProfile} alt="" />
            <div className="flex flex-col">
              <h3 className=" !text-xl font-bold leading-6 text-white w-[240px]">
                Friend Request
              </h3>
              <div className="text-white">
                Friend request from{" "}
                <span className="text-newPrimary">{`${
                  props?.PersonName || "Mr.Mac"
                }`}</span>
              </div>
            </div>
            <div className="flex items-center justify-end w-full gap-3 mt-0">
              <Button
                btnType={"primary-outline-button"}
                disabled={false}
                className={"!font-bold text-white !px-8"}
                onClick={() => {
                  rejectfriendRequest(props?.userIdd, props?.AgorIDD);
                }}
              >
                Decline
              </Button>
              <Button
                btnType={"primary-button"}
                disabled={false}
                className={"!bg-newPrimary !font-bold !px-8"}
                onClick={() => {
                  acceptfriendRequest(props?.userIdd, props?.AgorIDD);
                }}
              >
                Accept
              </Button>
            </div>
          </div>,
          { className: "backgroundEffectonPopup w-[600px]", duration: 4000 }
        );
      }
    } else if (props?.status === "Accepted") {
      {
        toast(
          <div className="flex">
            <div className="flex items-center gap-2">
              <img src={props?.personAvatar || DummyProfile} alt="" />
              <div className="flex flex-col">
                <h3 className=" !text-xl font-bold leading-6 text-white w-[280px]">
                  Friend Request Accepted
                </h3>
                <div className="text-white">
                  <span className="text-newPrimary">{`${
                    props?.PersonName || "Mr.Mac"
                  }`}</span>{" "}
                  is now your friend
                </div>
              </div>
            </div>
            <div className="-z-10 translate-x-4">
              <img src={Accept} alt="" />
            </div>
          </div>,
          { className: "backgroundEffectonPopup w-[480px]", duration: 4000 }
        );
      }
    } else if (props?.status === "Rejected") {
      {
        toast(
          <div className="flex">
            <div className="flex items-center gap-2">
              <img src={props?.personAvatar || DummyProfile} alt="" />
              <div className="flex flex-col">
                <h3 className=" !text-xl font-bold leading-6 text-white w-[280px]">
                  Friend Request Declined
                </h3>
                <div className="text-white">
                  <span className="text-newPrimary">{`${
                    props?.PersonName || "Mr.Mac"
                  }`}</span>{" "}
                  declined your request
                </div>
              </div>
            </div>
            <div className="translate-x-4 -z-10">
              <img src={Decline} alt="" />
            </div>
          </div>,
          { className: "backgroundEffectonPopup w-[480px]", duration: 4000 }
        );
      }
    }
  }, []);

  switch (props?.status) {
    case "Invited":
      return (
        <>
          <Toaster
            position="top-left"
            expand
            visibleToasts={1}
            className={`${showToast ? "hidden" : ""}`}
          />
        </>
      );
    case "Accepted":
      return (
        <>
          <Toaster
            position="top-left"
            expand
            visibleToasts={1}
            className={`${showToast ? "hidden" : ""}`}
          />
        </>
      );
    case "Rejected":
      return (
        <>
          <Toaster
            position="top-left"
            expand
            visibleToasts={1}
            className={`${showToast ? "hidden" : ""}`}
          />
        </>
      );
    default:
      return "";
  }
};

export default ChatPopUpModel;
