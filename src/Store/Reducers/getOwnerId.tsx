export default function getOwnerId(state = {}, action: any) {
  switch (action.type) {
    case "setOwnerId":
      return action.payload.data;
    case "removeOwnerId":
      return {};
    default:
      return state;
  }
}
