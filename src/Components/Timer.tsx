import React, { useState, useRef, useEffect } from "react";
import Icons from "./Icons";

interface TimerProps {
  startTime?: any;
  endTime?: any;
  setShowTimer?: any;
}

const Timer: React.FC<TimerProps> = ({ startTime, endTime, setShowTimer }) => {
  const [timer, setTimer] = useState("00:00:00");
  const [showTime, setshowTime] = useState(false);
  const CurrentTime: any = new Date();
  const [lessThan2min, setLessThan2min] = useState(false);

  let intervalControl: any;

  const getTimeRemaining = (e) => {
    let TodayDate: any = new Date();

    const total = Date.parse(e) - Date.parse(TodayDate);

    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return {
      total,
      hours,
      minutes,
      seconds,
    };
  };

  const startTimer = (e) => {
    let { total, hours, minutes, seconds } = getTimeRemaining(e);
    if (minutes < 2) {
      setLessThan2min(true);
    }

    if (total >= 0) {
      setTimer(
        (hours > 9 ? hours : "0" + hours) +
          ":" +
          (minutes > 9 ? minutes : "0" + minutes) +
          ":" +
          (seconds > 9 ? seconds : "0" + seconds)
      );
      setshowTime(true);
      setShowTimer(true);
    } else {
      setTimer("00:00:00");
      setshowTime(false);
      setShowTimer(false);
      clearInterval(intervalControl);
    }
  };

  const clearTimer = (e) => {
    clearInterval(intervalControl);
    intervalControl = setInterval(() => {
      const CurrentTime: any = new Date();

      if (CurrentTime >= startTime) {
        startTimer(e);
      }
    }, 1000);
  };

  const getDeadTime = () => {
    let deadline = new Date();

    const total = endTime - CurrentTime;

    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    deadline.setSeconds(deadline.getSeconds() + seconds);
    deadline.setMinutes(deadline.getMinutes() + minutes);
    deadline.setHours(deadline.getHours() + hours);

    return deadline;
  };

  useEffect(() => {
    clearTimer(getDeadTime());
    return () => {
      clearInterval(intervalControl);
    };
  }, []);

  return (
    <>
      {showTime ? (
        <div className="button-glass-effect p-4 rounded-full border-[1px] border-white border-opacity-60 text-white flex gap-4">
          <div>
            <Icons variant="Timer" />
          </div>
          <div className={`font-bold ${lessThan2min ? "text-orange-700" : ""}`}>
            {timer}
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};
export default Timer;
