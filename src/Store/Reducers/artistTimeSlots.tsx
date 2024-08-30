export default function artistTimeSlots(state = {}, action: any) {
  switch (action.type) {
    case "setTimeSlots":
      return action.payload.data;
    case "removeTimeSlots":
      return {};
    default:
      return state;
  }
}
