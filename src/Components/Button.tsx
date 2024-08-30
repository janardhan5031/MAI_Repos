import React, { ButtonHTMLAttributes, forwardRef } from "react";
import Icons from "./Icons";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  btnType?: string;
  variant?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  src?: any;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  active?: boolean;
}

const Button: React.FC<ButtonProps> = (
  {
    btnType,
    variant,
    className,
    onClick,
    src,
    loading,
    disabled,
    children,
    type,
    active,
  },
  ref
) => {
  switch (btnType) {
    case "icon-button":
      return (
        <button
          className={`p-4 rounded-full border-[1px] border-white border-opacity-60 ${className} ${
            active ? "bg-white bg-opacity-30" : ""
          } hover:bg-white hover:bg-opacity-20`}
          onClick={onClick}
        >
          <Icons variant={variant} className="w-6 h-6" />
          <span>{children}</span>
        </button>
      );
    case "image-button":
      return (
        <button
          className={`p-2 rounded-full border-[1px] border-white border-opacity-60 ${className} focus:bg-white focus:bg-opacity-30`}
          onClick={onClick}
        >
          <img src={src} className="max-w-[39px] max-h-[34px]" alt="" />
        </button>
      );
    case "primary-button":
      return (
        <button
          className={`py-3 md:font-normal font-thin whitespace-nowrap flex justify-center items-center text-white bg-primary rounded-full px-14 ${className}`}
          onClick={onClick}
          disabled={disabled ? disabled : false}
        >
          {!loading ? children : <Icons variant="loading" />}
        </button>
      );
    case "primary-outline-button":
      return (
        <button
          className={`py-3 border-[1px] px-14  ${
            disabled
              ? "bg-[#D5D7E8] text-white"
              : "text-[#731FF5] border-[#731FF5] "
          } text-base font-semibold rounded-full ${className}`}
          onClick={onClick}
          disabled={disabled ? disabled : false}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            border: "rgba(255, 255, 255, 0.2)",
          }}
        >
          {children}
        </button>
      );
    default:
      return (
        <button
          className={`text-base font-bold px-3 rounded-3xl ${className}`}
          onClick={onClick}
          type={type}
        >
          {children}
        </button>
      );
  }
};

export default Button;
