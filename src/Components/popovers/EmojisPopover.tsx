import React, { useEffect } from "react";
import Button from "../Button";
import love from "../../assets/love.png";
import claps from "../../assets/claps.png";
import fire from "../../assets/fire.png";
import bye from "../../assets/bye.png";
import laugh from "../../assets/laugh.png";

const EmojisPopover = (props) => {
  const emojis = [
    {
      variant: love,
    },
    {
      variant: laugh,
    },
    {
      variant: fire,
    },
    {
      variant: claps,
    },
    {
      variant: bye,
    },
  ];

  useEffect(() => {
    return () => {
      props.setConfettiActive(false);
      props.setSelectedEmoji({
        emoji: "",
        id: 0,
      });
    };
  }, []);

  return (
    <div>
      <div
        className={`mt-4 flex flex-col justify-end items-end absolute ${props.className}`}
      >
        <div
          className={`flex flex-col z-50 gap-y-4 p-4 py-6 rounded-full border-[1px] border-white border-opacity-60 relative emojis-glass-effect animate-fadeIn`}
        >
          {emojis.map((emoji) => (
            <Button
              btnType="image-button"
              src={emoji.variant}
              className="!border-0"
              onClick={() => {
                props.setConfettiActive(true);
                props.setSelectedEmoji({
                  emoji: emoji.variant,
                  id: Math.random(),
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojisPopover;
