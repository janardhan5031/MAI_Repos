import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { store } from "../Store";
import { useLazyQuery } from "@apollo/client";
import { killUserSession, validateJoinEvent } from "../Graphql/queries";
import mai from "../assets/mai_logo.png";
import { isMobile } from "react-device-detect";
import ConfirmationModal from "../Components/Modals/ConfirmationModal";
import Button from "../Components/Button";
import { useSelector } from "react-redux";
import { CONFIG } from "../config";
import { LOGIN } from "../Components/ConstantLinks";

const Auth = () => {
  const location = useLocation();
  const LoginReducer = useSelector((Data: any) => Data.LoginReducer);
  const queryParams = Object?.fromEntries(
    new URLSearchParams(location?.search)
  );
  const [validateJoinEventMethod, loading] = useLazyQuery(validateJoinEvent);
  const [killArtistSession] = useLazyQuery(killUserSession, {
    fetchPolicy: "no-cache",
  });
  const [isSessionActive, setSessionActive] = useState(false);
  const [isvalidtimeSolt, setValidtimesolt] = useState(false);
  useEffect(() => {
    if (queryParams?.accessToken && queryParams?.eventId) {
      console.log("Calling Validate");
      validateJoinEventMethod({
        variables: {
          eventId: queryParams?.eventId,
        },
        context: {
          headers: {
            Authorization: `Bearer ${queryParams.accessToken}`,
          },
        },
      })
        .then((res) => {
          console.log(res, "Calling Validate Graphql");
          if (res?.error && res?.error?.message === "User slot not found.") {
            setValidtimesolt(true);
          } else if (
            res?.error &&
            res?.error?.message === "Session Already active"
          ) {
            setSessionActive(true);
          } else {
            if (
              queryParams?.eventId === res?.data?.validateJoinEvent?.eventId
            ) {
              store.dispatch({
                type: "setLogin",
                payload: {
                  data: {
                    sessionToken: res?.data?.validateJoinEvent?.sessionToken,
                    touchDevice: isMobile,
                    ...res?.data?.validateJoinEvent?.loginResponse,
                    isMicEnabled: res?.data?.validateJoinEvent?.isMicEnabled,
                    isMusicEnabled:
                      res?.data?.validateJoinEvent?.isMusicEnabled,
                  },
                },
              });
              store.dispatch({
                type: "setOwnerId",
                payload: {
                  data: res?.data?.validateJoinEvent?.ownerId,
                },
              });
              store.dispatch({
                type: "setDataChannel",
                payload: {
                  data: queryParams,
                },
              });
              store.dispatch({
                type: "userLoggedIn",
              });
              if (res?.data?.validateJoinEvent?.isCustomAvatar) {
                store.dispatch({
                  type: "setCustomAvatar",
                });
              }
            }
          }
        })
        .catch((err) => console.log(err));
    }
  }, []);
  const killSession = () => {
    killArtistSession({
      context: {
        headers: {
          Authorization: `Bearer ${queryParams.accessToken}`,
        },
      },
    }).then(() => {
      console.log("vsdv");
      setSessionActive(false), window.location.reload();
    });
  };

  const handleExit = () => {
    window.location.href = CONFIG.ORG_LINK + LOGIN;
  };

  return isSessionActive ? (
    <>
      <ConfirmationModal
        isOpen={isSessionActive}
        setModal={setSessionActive}
        title="You're already logged in from another device."
      >
        <div className="flex items-center justify-center w-full gap-3 mt-0">
          <Button
            btnType={"primary-outline-button"}
            disabled={false}
            className={"!font-bold text-white"}
            onClick={() => {
              handleExit();
            }}
          >
            Cancel
          </Button>
          <Button
            btnType={"primary-button"}
            disabled={false}
            className={"!bg-[#DB0279] !font-bold"}
            onClick={killSession}
          >
            Continue
          </Button>
        </div>
      </ConfirmationModal>
    </>
  ) : isvalidtimeSolt ? (
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
  ) : (
    <div className="flex flex-col items-center justify-center w-screen h-screen gap-y-5">
      <div className="relative w-40 h-40">
        <div
          className="inline-block h-40 w-40 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-[#DB0279] motion-reduce:animate-[loader_1.5s_linear_infinite]"
          role="status"
        ></div>
        <img
          src={mai}
          className="absolute w-20 transform -translate-x-1/2 -translate-y-1/2 inset-1/2"
          alt=""
        />
      </div>
      <div className="text-2xl font-semibold">
        {"You are being redirected to Experience..."}
      </div>
    </div>
  );
};

export default Auth;
