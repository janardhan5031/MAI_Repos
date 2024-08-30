import React, { useEffect, useState } from "react";

interface EmojiConfettiProps {
  selectedEmoji: {
    emoji: string;
    id: number;
  };
}

const EmojiConfetti: React.FC<EmojiConfettiProps> = ({ selectedEmoji }) => {
  const [emojis, setEmojis] = useState<any>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEmoji = {
        id: Math.random(),
        left: Math.random() * 100 + "vw",
        animationDuration: Math.random() * 2 + 3 + "s",
        emoji: selectedEmoji.emoji,
      };
      setEmojis((prevemojis: any) => [...prevemojis, newEmoji]);

      setTimeout(() => {
        setEmojis((prevEmojis: any[]) =>
          prevEmojis.filter((emoji: any) => emoji.id !== newEmoji.id)
        );
      }, 1000);
    }, 2);

    setTimeout(() => clearInterval(interval), 200);
  }, [selectedEmoji]);

  return (
    <div className="absolute z-20 w-screen h-screen" id="confettiDiv">
      {emojis.map((emoji: any) => (
        <div
          key={emoji.id}
          className="emojis"
          style={{
            position: "absolute",
            left: emoji.left,
            animationDuration: emoji.animationDuration,
          }}
        >
          <img src={emoji.emoji} alt="" width={50} height={50} />
        </div>
      ))}
    </div>
  );
};

export default EmojiConfetti;
