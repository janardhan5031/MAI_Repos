export default function cartDetails(state = {}, action: any) {
  switch (action.type) {
    case "setCartDetails":
      return action.payload.data;
    case "removeCartDetails":
      return {};
    default:
      return state;
  }
}
