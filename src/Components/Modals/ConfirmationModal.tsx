import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useEffect } from "react";
import Icons from "../Icons";
import { CONFIG } from "../../config";
import { LOGIN } from "../ConstantLinks";

interface ConfirmationModalProps {
  isOpen: any;
  setModal: any;
  children: any;
  title: string;
  className?: any;
  setPosition?: any;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  setModal,
  children,
  title,
  className,
  setPosition,
}) => {
  useEffect(() => {
    if (isOpen && !title.includes("device") && !title.includes("Time")) {
      const timeoutId = setTimeout(() => {
        setModal(false);
      }, 20000); // 20 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          setModal(false);
        }}
      >
        <Transition.Child as={Fragment}>
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex items-center justify-center ${setPosition} min-h-full p-4 text-center`}
          >
            <Transition.Child
            //   as={Fragment}
            >
              <Dialog.Panel
                className={`w-[520px] max-w-md ${
                  location.pathname.includes("create-venue") ? "p-6" : "p-10"
                } ${className} overflow-visible font-semibold text-left align-middle transition-all transform backgroundEffectonPopup shadow-xl md:max-w-lg lg:max-w-lg rounded-3xl`}
              >
                <div className="flex items-center justify-center w-full">
                  <div>
                    <div
                      className="absolute -right-4 -top-3 border rounded-full p-3 cursor-pointer bg-gray-500 bg-opacity-4 border-none"
                      onClick={() => {
                        setModal(false);
                        if (
                          title?.includes("device.") ||
                          title?.includes("Time")
                        ) {
                          window.location.href = CONFIG.ORG_LINK + LOGIN;
                        }
                      }}
                    >
                      <Icons variant="close" fill="#d4d4d4" />
                    </div>
                    {title !== "" && (
                      <>
                        <Dialog.Title
                          as="h3"
                          className="mb-6 !text-xl text-center font-bold leading-6 text-white whitespace-nowrap"
                        >
                          {title}
                        </Dialog.Title>
                        {title.includes("device") && (
                          <>
                            <Dialog.Description
                              className={"text-white whitespace-nowrap mb-5"}
                            >{`Logging in from this device will log you out from all other devices`}</Dialog.Description>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmationModal;
