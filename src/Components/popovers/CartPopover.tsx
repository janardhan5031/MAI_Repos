import React, { useEffect, useLayoutEffect, useState } from "react";
import Icons from "../Icons";
import { Popover, Transition } from "@headlessui/react";
import Button from "../Button";
import ProductImage from "../../assets/handbag.png";
import ProductCard from "../ProductCard";
import { useQuery } from "@apollo/client";
import { getCartItems } from "../../Graphql/queries";
import { useSelector } from "react-redux";
import { store } from "../../Store";

const CartPopover = (props: any) => {
  const event_id = useSelector(
    (Data: any) => Data?.DataChannelReducer?.eventId
  );
  const cartData = useSelector((Data: any) => Data?.cartDetails);

  const {
    data: CartItems,
    loading,
    refetch,
  } = useQuery(getCartItems, {
    variables: {
      eventId: event_id,
    },
    fetchPolicy: "no-cache",
    pollInterval: 10 * 1000,
  });

  useEffect(() => {
    if (CartItems?.getCartItems?.length > 0) {
      store.dispatch({
        type: "setCartDetails",
        payload: {
          data: CartItems?.getCartItems,
        },
      });
    }

    const pollingTimeout = setTimeout(() => {
      refetch();
    }, 0);

    return () => clearTimeout(pollingTimeout);
  }, [refetch, CartItems]);

  return (
    <Popover className="relative">
      {(popoverProps) => (
        <>
          <Popover.Button as="div">
            <Button
              btnType="icon-button"
              variant="cart"
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
                  className={`absolute shadow gap-y-3 block top-2 -right-20 rounded-lg `}
                >
                  <div
                    className={`flex flex-col w-80 max-h-[400px] overflow-y-auto controls-popover-glass-effect text-white`}
                  >
                    <div className="flex items-center justify-between p-4 text-white rounded-tl-lg rounded-tr-lg gap-x-3 controls-popover-header-glass-effect">
                      <span className="font-medium">Cart</span>
                      <div
                        className="p-2 cursor-pointer"
                        onClick={() => close()}
                      >
                        <Icons variant="close" />
                      </div>
                    </div>
                    {cartData?.length > 0 ? (
                      cartData?.map((item, index) => (
                        <ProductCard key={index} product={item} />
                      ))
                    ) : (
                      <div className="flex py-4 px-3 border-b border-b-white border-opacity-20 border-solid text-white">
                        No Products Found
                      </div>
                    )}
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

export default CartPopover;
