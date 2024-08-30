export default function DataChannelReducer(state = {}, action: any) {
  switch (action.type) {
    case "setDataChannel":
      return action.payload.data;
    case "removeDataChannel":
      return {};
    default:
      return state;
  }
}
