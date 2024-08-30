import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface SwitchProps {
  initialValue: any;
  variant: any;
  children?: any;
  onToggle?: any;
  className?: string;
}

const Switch = ({
  initialValue,
  variant,
  children,
  onToggle,
  className,
}: SwitchProps) => {
  const { t } = useTranslation();
  const [isChecked, setIsChecked] = useState(initialValue);

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onToggle(newValue);
  };
  switch (variant) {
    case "login-switch":
      return (
        <div
          className={`w-[2.1rem] h-[1.25rem]  rounded-full flex gap-2 items-center px-1 duration-500 ease-in-out cursor-pointer ${
            isChecked ? "bg-primary" : "bg-[#D9D9D9]"
          } ${className}`}
          onClick={handleToggle}
        >
          <div
            className={`w-4 h-4 bg-white z-20 rounded-full shadow-md transform duration-500 ease-in-out ${
              isChecked ? "translate-x-[0.75rem]" : "-translate-x-[0.1rem]"
            }`}
          ></div>
        </div>
      );
  }
};

export default Switch;
