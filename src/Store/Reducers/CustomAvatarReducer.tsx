export default function CustomAvatar(state = false, action: any) {
  switch (action.type) {
    case "setCustomAvatar":
      return true;
    case "removeCustomAvatar":
      return false;
    default:
      return state;
  }
}
