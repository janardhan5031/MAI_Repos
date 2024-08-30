import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Typography from '../Typography';
import TextField from '../Inputs/TextField';
import { useLocation } from 'react-router-dom';
import { Tooltip as ToolTip } from 'react-tooltip';

const FormText: any = (props: {
  options: any[];
  type: string;
  placeholder?: string;
  value?: any;
  name: string;
  title: string;
  handleChange?: any;
  handleOnBlur?: any;
  setFieldValue: any;
  errors: any;
  touched: any;
  variant?: string;
  presentValue?: any;
  tags?: any;
  previousValue?: any;
  disabled?: boolean;
  loading?: boolean;
  isSearchable?: boolean;
  id?: string;
  countryCode: any;
  flag?: any;
  handleCountryChange: any;
  countriesData: any;
  selectedCountry: any;
  onFocus?: any;
}) => {
  const dispatch = useDispatch();
  switch (props.type) {
    case 'Text':
      return (
        <div>
          <TextField
            variant={props.variant ? props.variant : 'text'}
            title={props.title}
            name={props.name}
            type="text"
            id={props.id}
            value={props.value}
            onChange={props.handleChange}
            onBlur={props.handleOnBlur}
            error={props?.errors[props.name]}
            touched={props.touched[props.name]}
            disabled={props.disabled ? true : false}
            placeholder={
              props.placeholder ? props.placeholder : `Enter ${props.title}`
            }
          />
          <div className="h-5">
            {props.errors[props.name] && props.touched[props.name] ? (
              <span className="text-[#F44336] text-sm">
                <Typography variant="">{props.errors[props.name]}</Typography>
              </span>
            ) : null}
          </div>
        </div>
      );
      break;

    case 'outerText':
      return (
        <div>
          <TextField
            variant={props.variant ? props.variant : 'outerText'}
            title={props.title}
            name={props.name}
            type="text"
            value={props.value}
            onChange={props.handleChange}
            onBlur={props.handleOnBlur}
            error={props?.errors[props.name]}
            touched={props.touched[props.name]}
            placeholder={
              props.placeholder ? props.placeholder : `Enter ${props.title}`
            }
          />
          <div className="h-5">
            {props.errors[props.name] && props.touched[props.name] ? (
              <span className="text-[#F44336]">
                <Typography variant="h3">{props.errors[props.name]}</Typography>
              </span>
            ) : null}
          </div>
        </div>
      );
      break;

    case 'email':
      return (
        <div>
          <TextField
            variant={props.variant ? props.variant : 'email'}
            title={props.title}
            name={props.name}
            type="email"
            value={props.value}
            onChange={props.handleChange}
            onBlur={props.handleOnBlur}
            error={props.errors[props.name]}
            touched={props.touched[props.name]}
            placeholder={
              props.placeholder ? props.placeholder : `Enter ${props.title}`
            }
          />
          <div className="h-5">
            {props.errors[props.name] && props.touched[props.name] ? (
              <div className="text-[#F44336] text-sm">
                <Typography variant="h5">{props.errors[props.name]}</Typography>
              </div>
            ) : null}
          </div>
        </div>
      );

    case 'password':
      const [passwordScore, setPasswordScore] = useState(1);
      const location = useLocation();

      useEffect(() => {
        const hasNumber = /[0-9]/.test(props.value);
        const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(
          props.value,
        );
        const hasLowercase = /[a-z]/.test(props.value);
        const hasUppercase = /[A-Z]/.test(props.value);

        if (
          props.value.length >= 8 &&
          hasNumber &&
          hasSpecialChar &&
          hasLowercase &&
          hasUppercase
        ) {
          setPasswordScore(3); // Strong
        } else if (
          [hasNumber, hasSpecialChar, hasLowercase, hasUppercase].filter(
            (condition) => condition === true,
          ).length >= 3
        ) {
          setPasswordScore(2); // Fair
        } else {
          setPasswordScore(1); // Weak
        }
      }, [props.value]);

      let strengthText = '';
      switch (passwordScore) {
        case 1:
          strengthText = 'Weak';
          break;
        case 2:
          strengthText = 'Fair';
          break;
        case 3:
          strengthText = 'Strong';
          break;
        default:
          strengthText = 'Weak';
      }

      return (
        <div className="relative w-full">
          <TextField
            type="password"
            variant="password"
            title={props.title}
            id={props.id}
            name={props.name}
            value={props.value}
            onChange={props.handleChange}
            placeholder={props.placeholder}
            error={props.errors[props.name]}
            touched={props.touched[props.name]}
          />
          <>
            {(props.name === 'password' ||
              props.name === 'newPassword' ||
              props.name === 'confirmPassword') &&
              (location.pathname === '/signup' ||
                location.pathname === '/profile' ||
                location.pathname === '/validate') &&
              props.value.length > 0 && (
                <div
                  className={`${
                    props.name === 'password' ||
                    props.name === 'newPassword' ||
                    props.name === 'confirmPassword'
                      ? location.pathname === '/signup' ||
                        location.pathname === '/profile' ||
                        location.pathname === '/validate'
                        ? 'h-5'
                        : 'h-5'
                      : 'h-5'
                  }`}
                >
                  <>
                    <div className="flex items-center pb-1 text-sm">
                      <div className="w-full p-0 -mt-1 transition-all delay-100">
                        {strengthText === 'Weak' && (
                          <div className="w-full">
                            <div
                              className="w-1/5 h-[2px] bg-red-500 rounded"
                              id="password-weak"
                            ></div>
                          </div>
                        )}
                        {strengthText === 'Fair' && (
                          <div className="flex w-full gap-1">
                            <div
                              className="w-1/5 h-[2px] bg-[#E0A303] rounded"
                              id="password-weak"
                            ></div>
                            <ToolTip
                              anchorId="password-weak"
                              className="p-2 text-xs font-medium bg-black rounded-lg"
                              place="bottom"
                              content="Fair"
                            />
                            <div
                              className="w-1/5 h-[2px] bg-[#E0A303] rounded"
                              id="password-fair"
                            ></div>
                            <ToolTip
                              anchorId="password-fair"
                              className="p-2 text-xs font-medium bg-black rounded-lg"
                              place="bottom"
                              content="Fair"
                            />
                          </div>
                        )}
                        {strengthText === 'Strong' && (
                          <div className="flex w-full gap-1">
                            <div
                              className="w-1/5 h-[2px] bg-green-500 rounded"
                              id="password-weak"
                            ></div>
                            <ToolTip
                              anchorId="password-weak"
                              className="p-2 text-xs font-medium bg-black rounded-lg"
                              place="bottom"
                              content="Strong"
                            />
                            <div
                              className="w-1/5 h-[2px] bg-green-500 rounded"
                              id="password-fair"
                            ></div>
                            <ToolTip
                              anchorId="password-fair"
                              className="p-2 text-xs font-medium bg-black rounded-lg"
                              place="bottom"
                              content="Strong"
                            />
                            <div
                              className="w-1/5 h-[2px] bg-green-500 rounded"
                              id="password-strong"
                            ></div>
                            <ToolTip
                              anchorId="password-strong"
                              className="p-2 text-xs font-medium bg-black rounded-lg"
                              place="bottom"
                              content="Strong"
                            />
                          </div>
                        )}
                      </div>
                      <div className="w-1/3 pl-1 font-normal text-right">
                        {strengthText}
                      </div>
                    </div>
                  </>
                </div>
              )}
          </>
          {props.errors[props.name] && props.touched[props.name] ? (
            <div className="text-[#F44336]">
              <Typography variant="h3">{props.errors[props.name]}</Typography>
            </div>
          ) : null}
        </div>
      );

    case 'default-password':
      return (
        <div className="relative w-full">
          <TextField
            type="password"
            variant={props.variant}
            title={props.title}
            id={props.id}
            name={props.name}
            value={props.value}
            placeholder={props.placeholder}
            onBlur={props.handleOnBlur}
            onChange={props.handleChange}
            error={props.errors[props.name]}
            touched={props.touched[props.name]}
          />
          <div className="h-5">
            {props.errors[props.name] && props.touched[props.name] ? (
              <div className="text-[#F44336] text-sm">
                <Typography variant="h5">{props.errors[props.name]}</Typography>
              </div>
            ) : null}
          </div>
        </div>
      );

    case 'country':
      const [selected, setSelected] = useState(props?.options[0].flag);
      const currentCountryCode = useSelector((Data: any) => Data.CountryCode);

      useEffect(() => {
        setSelected(
          props?.options.find((x: any) => x.dial_code === currentCountryCode)
            ?.flag,
        );
      }, [props?.options, selected, currentCountryCode]);

      const onChangeCountry = (e: any) => {
        dispatch({
          type: 'setCountryFlag',
          payload: {
            data: props?.options.find((x: any) => {
              return x.dial_code === e.target.value;
            })?.flag,
          },
        });

        props.setFieldValue(props?.name, e.target.value);
        dispatch({
          type: 'setCountryCode',
          payload: {
            data: e.target.value,
          },
        });
      };

      return (
        <div className="w-24 px-3 md:w-24 lg:w-24">
          <select
            disabled={props.disabled ? true : false}
            name={props.title}
            onChange={onChangeCountry}
            onBlur={props.handleOnBlur}
            autoComplete="on"
            id="countryCode"
            className="w-full h-12 align-text-bottom bg-transparent border-0 cursor-pointer md:w-20 lg:w-full focus:outline-none"
          >
            {props?.options.map((item: any, index: number) => (
              <>
                <option
                  key={index}
                  value={item.dial_code}
                  className="block border-0"
                >
                  {`${item.code} ${item.flag} `}
                </option>
              </>
            ))}
          </select>
        </div>
      );

    case 'verifyOTP':
      let currentOTPIndex = 0;

      const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));

      let joinedOTp = otp.join('');

      useEffect(() => {
        if (joinedOTp.length === 6) {
          props.setFieldValue(props?.name, joinedOTp);
        }
      }, [joinedOTp]);

      const [activeOTPIndex, setActiveOTPIndex] = useState<number>(0);

      const inputRef = useRef<HTMLInputElement>(null);

      const handleOTPChange = ({
        target,
      }: React.ChangeEvent<HTMLInputElement>): void => {
        const { value } = target;
        const newOTP: string[] = [...otp];
        newOTP[currentOTPIndex] = value.substring(value.length - 1);
        if (!value) setActiveOTPIndex(currentOTPIndex - 1);
        else setActiveOTPIndex(currentOTPIndex + 1);

        setOtp(newOTP);
      };

      const handleKeyDown = (e: any, index: number) => {
        currentOTPIndex = index;
        if (e.key === 'e') {
          e.preventDefault();
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          setActiveOTPIndex(currentOTPIndex + 1);
        }
        if (e.key === 'Backspace' && !e.target.value) {
          e.preventDefault();
          setActiveOTPIndex(currentOTPIndex - 1);
        }
      };

      const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedOTP: string = e.clipboardData.getData('text/plain');
        if (pastedOTP.length === 6) {
          const newOTP: string[] = pastedOTP.split('');
          setOtp(newOTP);
          setActiveOTPIndex(5);
        }
      };

      useEffect(() => {
        inputRef.current?.focus();
      }, [activeOTPIndex, otp]);

      return (
        <div className="flex flex-col justify-center">
          <div className="flex space-x-7 md:space-x-3">
            {otp.map((_, index) => {
              return (
                <React.Fragment key={index}>
                  <input
                    ref={index === activeOTPIndex ? inputRef : null}
                    type="number"
                    placeholder="—"
                    value={otp[index]}
                    onChange={handleOTPChange}
                    onPaste={handlePaste}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`w-20 m-0 text-xl font-semibold text-center text-gray-400 transition bg-transparent border border-gray-400 rounded outline-none appearance-noneh-14 md:h-10 lg:h-12 md:w-10 focus:placeholder-white lg:w-14  ${
                      props.errors[props.name] && props.touched[props.name]
                        ? 'border-red-400 focus:border-primary '
                        : 'focus:border-primary'
                    }`}
                    autoComplete="off"
                    id={'otp' + index}
                  />
                </React.Fragment>
              );
            })}
          </div>
          {props.errors[props.name] && props.touched[props.name] ? (
            <div className="mt-2 text-[#F44336]">
              <Typography variant="h5">{props.errors[props.name]}</Typography>
            </div>
          ) : null}
        </div>
      );

    case 'phone':
      const CountryCode = useSelector((Data: any) => Data.CountryCode);
      return (
        <>
          <div className="relative flex items-center justify-start w-full md:max-w-[210px] lg:w-full">
            <div className="w-0.5 self-stretch opacity-[40%] bg-lightSilver"></div>
            <div className="w-10 mx-2">{CountryCode}</div>
            <TextField
              variant="phone"
              title={props.title}
              name={props.name}
              value={props.value}
              onChange={props.handleChange}
              onBlur={props.handleOnBlur}
              onFocus={props.onFocus}
              placeholder="Mobile Number"
              error={props.errors[props.name]}
              touched={props.touched[props.name]}
              className="focus:outline-none"
            />
          </div>

          <div className="absolute h-5 pt-2 pb-3 mt-16 left-10">
            {props.errors[props.name] && props.touched[props.name] ? (
              <>
                <div className="text-[#F44336] text-sm">
                  <Typography variant="h5">
                    {props.errors[props.name]}
                  </Typography>
                </div>
              </>
            ) : null}
          </div>
        </>
      );
    case 'Tags':
      const handleBlur = (e: any) => {
        e.preventDefault();
        const value = e?.currentTarget?.value?.trim();
        if (value !== '') {
          props?.setFieldValue(props?.name, [...props?.presentValue, value]);
          e.currentTarget.value = '';
        }
      };
      return (
        <div className="py-2">
          <label className="py-1 text-lg">{props?.title}</label>
          <div className="flex flex-wrap items-center gap-2 p-2 w-full min-h-[55px] border rounded border-creation-border ">
            {props?.presentValue?.map((tag: string, index: number) => (
              <div
                key={index}
                className="flex items-center px-2 py-2 text-white rounded bg-slate-900"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  className="ml-2"
                  onClick={() =>
                    props.setFieldValue(props?.presentValue.splice(index, 1))
                  }
                >
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.293 4.293a1 1 0 011.414 1.414L11.414 10l5.293 5.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 10 3.293 4.707a1 1 0 011.414-1.414L10 8.586l5.293-5.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <input
              type="text"
              disabled={props.disabled ? true : false}
              placeholder={'Add Tag'}
              name="Tags"
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (props?.presentValue.length >= 6) {
                  if (e.key === 'Backspace') {
                    props.presentValue.pop();
                    props?.setFieldValue(props?.name, [...props.presentValue]);
                  }
                  props.touched.Tags = true;
                  props.errors.Tags =
                    'You can only give 5 tags for a creation.';
                  e.preventDefault();
                  return;
                }
                if (e.key === 'Enter' || e.code === 'Space') {
                  e.preventDefault();

                  const value = e?.currentTarget?.value?.trim();
                  if (value !== '') {
                    props?.setFieldValue(props?.name, [
                      ...props?.presentValue,
                      value,
                    ]);
                    e.currentTarget.value = '';
                  }
                }
                if (e.key === 'Backspace') {
                  const value = e?.currentTarget?.value?.trim();

                  if (value == '') {
                    props?.presentValue.pop();
                    props?.setFieldValue(props?.name, [...props?.presentValue]);
                  }
                }
              }}
              className="flex-1 w-full focus:outline-0"
            />
          </div>

          {props?.presentValue.length >= 6 && (
            <div className="text-[#F44336]">
              <Typography variant="h4">
                You can only give 5 tags for a creation.
              </Typography>
            </div>
          )}
          {props.errors[props.name] && props.touched[props.name] ? (
            <div className="text-[#F44336]">
              <Typography variant="h5">{props.errors[props.name]}</Typography>
            </div>
          ) : null}
        </div>
      );

    case 'ContactText':
      return (
        <div>
          <TextField
            variant="contact-text"
            title={props.title}
            name={props.name}
            type="text"
            value={props.value}
            onChange={props.handleChange}
            onBlur={props.handleOnBlur}
            error={props?.errors[props.name]}
            touched={props.touched[props.name]}
            placeholder={
              props.placeholder ? props.placeholder : `Enter ${props.title}`
            }
          />
          {props.errors[props.name] && props.touched[props.name] ? (
            <span className="p-5 text-[#F44336]">
              <Typography variant="h4">{props.errors[props.name]}</Typography>
            </span>
          ) : null}
        </div>
      );
      break;

    case 'otpBox':
      return (
        <div>
          <TextField
            variant={'otpBox'}
            title={props.title}
            name={props.name}
            type="text"
            value={props.value}
            onChange={props.handleChange}
            onBlur={props.handleOnBlur}
            error={props?.errors[props.name]}
            touched={props.touched[props.name]}
            placeholder="    -     "
          />
          <Typography variant="h5">{props.errors[props.name]}</Typography>
        </div>
      );
      break;

    default:
      break;
  }
};

export default FormText;
