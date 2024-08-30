import React from "react";
import Typography from "./Typography";
import Button from "./Button";
import { Navigate, useLocation } from "react-router-dom";
import Icons from "./Icons";
import { useLazyQuery, useMutation } from "@apollo/client";
import { deleteFromCart } from "../Graphql/mutations";
import { useSelector } from "react-redux";
import { getCartItems } from "../Graphql/queries";
import { store } from "../Store";

const ProductCard: React.FC<any> = ({ product }) => {
  const [deleteCart] = useMutation(deleteFromCart);
  const [cartDetails] = useLazyQuery(getCartItems);

  const event_id = useSelector(
    (Data: any) => Data?.DataChannelReducer?.eventId
  );

  return (
    <div className="flex flex-row py-4 px-3 border-b border-b-white border-opacity-20 border-solid text-white">
      {/* Product Image Section */}
      <div className="flex items-center justify-center w-20 h-20 bg-white rounded-md">
        <img
          src={product?.media?.thumbnail}
          alt={product?.name}
          className="w-14 h-14 aspect-video object-contain rounded-md whitespace-nowrap"
        />
      </div>
      {/* Product Description Section */}
      <div className="flex flex-col gap-2 justify-center whitespace-normal flex-[3] pl-2">
        <Typography
          className="text-white font-semibold text-sm w-40 overflow-hidden text-ellipsis whitespace-nowrap"
          title={product?.name}
        >
          {product?.name}
        </Typography>
        {/* Price Section */}
        <div className="flex items-center gap-x-4">
          <div className="mr-2 text-white">
            <Typography className="font-bold text-base text-white">
              Rs.&nbsp;{product?.price}
            </Typography>
          </div>
          <div>
            <Typography className="line-through text-white text-xs font-normal">
              Rs. 1999
            </Typography>
          </div>
        </div>
      </div>
      {/* Buy Product and Delete */}
      <div className="flex items-center gap-4 mt-2">
        <div
          className="cursor-pointer mt-2 sm:mt-0 p-2 bg-[#F63D3D] bg-opacity-20"
          onClick={() => {
            deleteCart({
              variables: {
                eventId: event_id,
                productId: product?._id,
              },
            }).then((Data: any) => {
              cartDetails({
                variables: {
                  eventId: event_id,
                },
                fetchPolicy: "no-cache",
              }).then((Data) => {
                store.dispatch({
                  type: "setCartDetails",
                  payload: {
                    data: Data?.data?.getCartItems,
                  },
                });
              });
            });
          }}
        >
          <Icons variant="delete" />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
