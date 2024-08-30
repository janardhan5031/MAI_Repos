import { gql } from "@apollo/client";

export const getDanceMoves = gql`
  query getDanceMoves {
    danceMoves {
      _id
      icon
      name
      unityDanceId
    }
  }
`;
export const validateJoinEvent = gql`
  query validateJoinEvent($eventId: String!) {
    validateJoinEvent(eventId: $eventId)
  }
`;

export const getCartItems = gql`
  query getCartItems($eventId: String!) {
    getCartItems(eventId: $eventId)
  }
`;

export const artistLatestTimeSlot = gql`
  query artistLatestTimeSlot($eventId: String!) {
    artistLatestTimeSlot(eventId: $eventId)
  }
`;

export const validateAccessToken = gql`
  query validateAccessToken($eventId: String!, $sessionToken: String!) {
    validateAccessToken(eventId: $eventId, sessionToken: $sessionToken)
  }
`;

export const killUserSession = gql`
  query killUserSession {
    killUserSession
  }
`;

export const danceMovesSearch = gql`
  query danceMovesSearch($input: String!) {
    danceMovesSearch(input: $input)
  }
`;

export const groupChatUser = gql`
  query groupChatUser(
    $eventId: String!
    $paginationInput: paginationInput!
    $searchUser: String
  ) {
    groupChatUser(
      eventId: $eventId
      paginationInput: $paginationInput
      searchUser: $searchUser
    )
  }
`;

export const friendList = gql`
  query friendList($paginationInput: paginationInput!, $username: String) {
    friendList(paginationInput: $paginationInput, username: $username)
  }
`;

export const agoraUserDetails = gql`
  query agoraUserDetails($agoraId: String) {
    agoraUserDetails(agoraId: $agoraId)
  }
`;
