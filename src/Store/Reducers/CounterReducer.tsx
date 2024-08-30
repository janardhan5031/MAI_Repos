export default function CounterReducer(state = 0, action: any) {
  switch (action.type) {
    case "INCREMENT":
      return action.payload.data;
    default:
      return state;
  }
}
