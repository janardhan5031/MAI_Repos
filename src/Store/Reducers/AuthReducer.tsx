export default function AuthReducer(state = true, action: any) {
  switch (action.type) {
    case "userLoggedIn":
      return true;
    case "userLoggedOut":
      return false;
    default:
      return state;
  }
}
