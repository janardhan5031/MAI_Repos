import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip as ToolTip } from "react-tooltip";

import Icons from "../Icons";

const TextField = (props: {
  variant: string;
  title?: string;
  type?: string;
  placeholder?: string;
  touched?: any;
  error?: any;
  onChange?: any;
  onBlur?: any;
  value?: any;
  name: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  onFocus?: any;
}) => {
  const { t } = useTranslation();

  switch (props.variant) {
    case "phone":
      return (
        <div className="items-center block w-full md:max-w-[200px] lg:w-full">
          <input
            type="text"
            name={props.name}
            onChange={props.onChange ? props.onChange : null}
            value={props.value}
            onBlur={props.onBlur ? props.onBlur : null}
            onFocus={props.onFocus}
            id="phone"
            maxLength={12}
            placeholder={` ${t("Your mobile number")}`}
            autoComplete="off"
            className="w-full max-w-[330px] lg:w-full h-12 focus:outline-none"
          />
        </div>
      );
      break;

    case "auto":
      return (
        <>
          <label className="block">
            <span className="block w-full pb-1 text-sm font-medium text-slate-700">
              {props.title}
            </span>
            <input
              type={props.type ? props.type : "text"}
              name={props.title}
              onChange={props.onChange ? props.onChange : null}
              onBlur={props.onBlur ? props.onBlur : null}
              className="peer w-full h-12 p-2.5 bg-slate-200 focus:bg-white rounded-md 
              
             outline-none"
            />
            {props.error ? (
              <p className="invisible mt-2 text-sm text-pink-600 peer-invalid:visible">
                {props.error}
              </p>
            ) : null}
          </label>
        </>
      );
      break;

    case "outerText":
      return (
        <>
          <label className="block ">
            <span className="block w-full text-sm font-medium text-creation-text">
              {props.title}
            </span>
            <input
              type={props.type ? props.type : "text"}
              name={props.name}
              value={props.value}
              autoComplete="off"
              onChange={props.onChange ? props.onChange : null}
              onBlur={props.onBlur ? props.onBlur : null}
              placeholder={props.placeholder}
              className="w-full h-12 p-2.5 border  rounded-md border-creation-border "
            />
          </label>
        </>
      );
      break;
    case "text":
      return (
        <>
          <div className="relative top-0 items-center block w-full">
            <input
              type={props.type ? props.type : "text"}
              name={props.name}
              onChange={props.onChange ? props.onChange : null}
              onBlur={props.onBlur ? props.onBlur : null}
              placeholder={props.placeholder}
              // autoComplete="off"
              disabled={props.disabled}
              value={props.value}
              className={`w-full h-12 pl-4 border-2 placeholder:text-sm rounded-xl focus:outline-none  focus:border-primary ${
                props.disabled
                  ? "cursor-not-allowed font-light text-gray-500"
                  : ""
              } ${
                props.error && props.touched
                  ? "border-red-400 focus:border-primary "
                  : "focus:border-primary"
              }`}
            />
            {/* <div className="absolute inset-y-0 left-0 flex items-center px-3.5 pointer-events-none">
              <Icons variant="person" />
            </div> */}
          </div>
        </>
      );
      break;
    case "password":
      const [show, setShow] = useState(false);

      const contentLines = [
        "8 - 20 characters",
        "1 digit",
        "1 upper case & lower case alphabet",
        "1 special character (!@#$%&* ()-+=^.)",
      ].map((line, index) => (
        <span className="text-xs font-normal" key={index}>
          {line}
        </span>
      ));

      return (
        <>
          <div className="relative w-full">
            <div className="absolute inset-y-0 right-0 flex items-center px-5 cursor-pointer">
              <input
                className="hidden"
                type="checkbox"
                value={props.value}
                onClick={(e) => {
                  setShow(!show);
                }}
              />
              <span
                onClick={(e: any) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShow(!show);
                }}
                id={props.id}
              >
                <Icons
                  variant={show ? "show-password" : "hide-password"}
                  className=""
                />
              </span>
              <ToolTip
                anchorId={props.id}
                className="z-10 p-2 text-xs font-medium bg-black rounded-lg"
                place="bottom"
                content={show ? "Hide Password" : "Show Password"}
              />
            </div>
            <div className="absolute inset-y-0 top-0 left-0 flex items-center px-3.5 pointer-events-none">
              <Icons variant="password" />
            </div>
            <input
              type={show ? "text" : "password"}
              name={props.name}
              onChange={props.onChange ? props.onChange : null}
              onBlur={props.onBlur ? props.onBlur : null}
              id={props.id + 1}
              value={props.value}
              autoComplete="new-password"
              className={`w-full h-12 pl-12 placeholder:text-sm placeholder:font-normal border-2 focus:outline-none rounded-xl
              ${
                props.error && props.touched
                  ? "border-red-400 focus:border-primary "
                  : "focus:border-primary"
              }`}
              placeholder={props.placeholder}
            />
          </div>
        </>
      );

    case "email-input":
      return (
        <div className="relative top-0 items-center block w-full">
          <input
            type="text"
            name={props.name}
            onChange={props.onChange ? props.onChange : null}
            onBlur={props.onBlur ? props.onBlur : null}
            id={props.id}
            value={props.value}
            autoComplete="off"
            placeholder={props.placeholder}
            className={`w-full h-12 pl-12 rounded-xl border-2 placeholder:text-sm focus:outline-none placeholder:text-black placeholder:opacity-[40%]
            ${
              props.error && props.touched
                ? "border-red-400 focus:border-primary "
                : "focus:border-primary"
            }           
            `}
          />
          <div className="absolute inset-y-0 left-0 flex items-center px-3.5 pointer-events-none">
            <Icons variant="email-box" />
          </div>
        </div>
      );

    default:
      return (
        <label className="block">
          <span className="block w-full text-sm font-medium text-slate-700">
            {props.title}
          </span>
          <input type={props.type ? props.type : "text"} className="peer" />
          {props.error ? (
            <p className="invisible mt-2 text-sm text-pink-600 peer-invalid:visible">
              {props.error}
            </p>
          ) : null}
        </label>
      );
      break;
  }
};

export default TextField;
