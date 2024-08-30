import React, { useEffect, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import { danceMovesSearch, getDanceMoves } from "../../Graphql/queries";
import { SendData } from "../../../public/Experience/js/receiver.js";

const DanceMovesPopover = (props: any) => {
  const [selected, setSelected]: any = useState();
  const [searchName, setSearchName] = useState("");
  const { data: danceMoves, loading: danceMovesLoading } = useQuery(
    getDanceMoves,
    {
      fetchPolicy: "no-cache",
    }
  );
  const callMyFunction = (data) => {
    if ((window as any).myCustomFunction) {
      (window as any).myCustomFunction({ name: data.name, id: data.id });
    } else {
      console.log("codecPreferences");
    }
  };

  const { data: danceMoveSearch, refetch } = useQuery(danceMovesSearch, {
    variables: {
      input: searchName,
    },
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    refetch();
  }, [searchName, refetch]);

  return (
    <div
      className={`mt-6 flex flex-col justify-end items-end ${props.className} z-50 absolute`}
    >
      <div
        className={`flex flex-col w-96 max-h-[450px] chat-glass-effect rounded-lg text-white animate-fadeIn`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center p-4 text-white rounded-tl-lg rounded-tr-lg gap-x-3 chat-glass-effect-header">
          <span className="font-medium">Dance Moves</span>
        </div>
        <div className="relative p-4 overflow-y-auto scrollable-div">
          <div className="text-center mb-4">
            <input
              type="text"
              className="p-3 min-w-[320px] rounded-xl text-lg placeholder:text-white focus:outline-none text-white"
              placeholder="Search Dance Moves"
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
          <div className="flex h-96">
            {danceMoveSearch?.danceMovesSearch?.length > 0 &&
            danceMoveSearch?.danceMovesSearch ? (
              <div className="grid grid-cols-2 gap-x-3">
                {danceMoveSearch?.danceMovesSearch?.map((move, index) => (
                  <div
                    className={`flex flex-col items-center rounded-xl border-[1px] border-white border-opacity-60 w-40 h-40 mb-3 cursor-pointer ${
                      selected === index ? "bg-[#DB0279]" : "bg-transparent"
                    }`}
                    onClick={() => {
                      selected === index ? setSelected() : setSelected(index);
                      callMyFunction({
                        name: move.name,
                        id: move.unityDanceId,
                      });
                      // SendDanceMoves({ name: move.name, id: move.unityDanceId });
                      // props.setIsDanceMovesPopoverOpen(false);
                    }}
                    key={index}
                  >
                    <div
                      // onClick={SendDanceMoves({ name: "", id: "" })}
                      className="absolute w-24 text-center font-semibold mt-1 whitespace-normal overflow-hidden max-h-[3rem]"
                    >
                      {move?.name}
                    </div>
                    <img
                      src={move?.icon}
                      alt=""
                      className="object-cover h-full mt-6 rounded-md cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-28">{"No dance move found"}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DanceMovesPopover;
