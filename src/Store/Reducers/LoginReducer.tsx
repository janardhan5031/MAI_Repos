export default function LoginReducer(state = {}, action: any) {
  switch (action.type) {
    case "setLogin":
      return action.payload.data;
    case "removeLogin":
      return {};
    default:
      return state;
  }
}
