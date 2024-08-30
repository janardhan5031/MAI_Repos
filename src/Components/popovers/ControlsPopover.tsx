import React from "react";
import Icons from "../Icons";
import move from "../../assets/move.png";
import { Popover, Transition } from "@headlessui/react";
import Button from "../Button";
import MouseRightClick from "../../assets/MouseRightClick.png";

const ControlsPopover = (props: any) => {
  return (
    <Popover className="relative">
      {(popoverProps) => (
        <>
          <Popover.Button as="div">
            <Button
              btnType="icon-button"
              variant="joystick"
              className={`button-glass-effect`}
              active={popoverProps.open}
              onClick={() => props.setSelectedPopover("nothing")}
            />
          </Popover.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-100 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Popover.Panel className="absolute z-10 bg-white">
              {({ close }) => (
                <div
                  className={`absolute shadow gap-y-3 z-50 block top-4 -right-16 rounded-lg`}
                >
                  <div
                    className={`flex flex-col w-96 controls-popover-glass-effect text-white`}
                  >
                    <div className="flex justify-between items-center p-4 gap-x-3 text-white controls-popover-header-glass-effect rounded-tl-lg rounded-tr-lg">
                      <span className="font-medium">Controls</span>
                      <div
                        className="cursor-pointer p-2"
                        onClick={() => close()}
                      >
                        <Icons variant="close" />
                      </div>
                    </div>
                    <div className="overflow-y-auto h-[480px]">
                      <div className="p-8 flex flex-col gap-x-16 items-center justify-center gap-y-10">
                        <div>
                          <div className="flex gap-x-2 justify-center">
                            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
                              <span>W</span>
                            </div>
                          </div>
                          <div className="mt-2 flex gap-x-2">
                            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
                              <span>A</span>
                            </div>
                            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
                              <span>S</span>
                            </div>
                            <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
                              <span>D</span>
                            </div>
                          </div>
                          <div className="mt-5 flex gap-x-2 justify-center">
                            <span className="block leading-4 text-white">
                              Player Moves
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-y-5">
                          <span className="block leading-4 text-white border-[1px] border-white p-3 w-48 text-center rounded-md button-glass-effect">
                            SPACE BAR
                          </span>
                          <span className="block leading-4 text-white">
                            Jump
                          </span>
                        </div>{" "}
                        <div className="flex flex-col items-center gap-y-5">
                          <img src={move} alt="" />
                          <span className="block leading-4 text-white">
                            Right click and drag to move the scene
                          </span>
                        </div>
                        <div className="items-center hidden lg:flex lg:flex-col">
                          <div className="flex">
                            <div className="flex flex-col">
                              <div className="flex gap-x-4">
                                <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
                                  <span>F</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex mx-2 gap-2">
                                <div className="flex items-center">
                                  <Icons variant="right-arrow" />
                                </div>
                                <div className="flex items-center justify-center text-white border-[1px] border-white w-14 h-14 text-center rounded-md button-glass-effect">
                                  <span>c</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-8">
                            <div className="flex mt-5 ml-6">
                              open selfie view
                            </div>
                            <div className="flex mt-5 mx-auto">
                              Capture selfie
                            </div>
                          </div>
                        </div>
                        <div className="items-center gap-y-5 hidden lg:flex lg:flex-col">
                          <img src={MouseRightClick} alt="" />
                          <span className="block leading-4 text-white text-center">
                            Right click and drag to change the view to capture
                            selfie
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default ControlsPopover;
