export default function groupId(state = "", action: any) {
  switch (action.type) {
    case "setGroupId":
      return action.payload.data;
    case "removeGroupId":
      return "";
    default:
      return state;
  }
}
