import { gql } from "@apollo/client";

export const LoginAttendee = gql`
  mutation loginAttendee($input: CredentialsInputType!) {
    loginAttendee(input: $input) {
      _id
      access_token
      country_code
      created_on
      email
      first_name
      is_active
      is_email_verified
      is_kyc_completed
      kyc_case_id
      last_name
      org_id
      preferred_name
      profile_image
      refresh_token
      roles
      session_id
      user_name
    }
  }
`;

export const deleteFromCart = gql`
  mutation deleteFromCart($eventId: String!, $productId: String!) {
    deleteFromCart(eventId: $eventId, productId: $productId)
  }
`;

export const refreshToken = gql`
  mutation refreshToken {
    refreshToken
  }
`;

export const registerAgoraUser = gql`
  mutation registerUser {
    registerUser
  }
`;

export const addUserToChatGroup = gql`
  mutation addUserToChatGroup($eventId: String!) {
    addUserToChatGroup(eventId: $eventId)
  }
`;

export const sendFriendRequest = gql`
  mutation sendFriendRequest($userId: String!) {
    sendFriendRequest(userId: $userId)
  }
`;

export const acceptFriendRequest = gql`
  mutation acceptFriendRequest($userId: String!) {
    acceptFriendRequest(userId: $userId)
  }
`;

export const rejectFriendRequest = gql`
  mutation rejectFriendRequest($userId: String!) {
    rejectFriendRequest(userId: $userId)
  }
`;
