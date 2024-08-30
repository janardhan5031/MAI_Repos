export function skipValidation(
  query: string,
  operationName: string
): boolean {
  const introspectionRegex = /IntrospectionQuery/i; // Case-insensitive regex
  const introspectionFragmentsRegex = /FullType|InputValue|TypeRef/i; // Case-insensitive regex

  const hasIntrospectionFragment = introspectionFragmentsRegex.test(query);

  const hasQuery =
    introspectionRegex.test(query) ||
    /{\s*validateForgotPassword\b/.test(query) ||
    /{\s*resendOTP\b/.test(query) ||
    /{\s*resendEmailVerification\b/.test(query) ||
    /{\s*getLanguages\b/.test(query) ||
    /{\s*updateProgress\b/.test(query) ||
    /{\s*events\b/.test(query) ||
    /{\s*updateKYC\b/.test(query) ||
    /{\s*organisationExistence\b/.test(query) ||
    /{\s*previousEvents\b/.test(query) ||
    /{\s*organizerProfile\b/.test(query) ||
    /{\s*latestArtistAndGallery\b/.test(query) ||
    /{\s*getOrganizerFavorites\b/.test(query) ||
    /{\s*searchEvents\b/.test(query);
    /{\s*getOrganiserName\b/.test(query);

  const hasMutation =
    /mutation\s*{\s*registration\b/.test(query) ||
    /mutation\s*{\s*registerUser\b/.test(query) ||
    /mutation\s*{\s*login\b/.test(query) ||
    /mutation\s*{\s*loginCustomer\b/.test(query) ||
    /mutation\s*{\s*verifyOTP\b/.test(query) ||
    /mutation\s*{\s*forgotPassword\b/.test(query) ||
    /mutation\s*{\s*artistForgotPassword\b/.test(query) ||
    /mutation\s*{\s*validateForgotPassword\b/.test(query) ||
    /mutation\s*{\s*createProps\b/.test(query) ||
    /mutation\s*{\s*addVendor\b/.test(query) ||
    /mutation\s*{\s*setPassword\b/.test(query) ||
    /mutation\s*{\s*resendVerficationLink\b/.test(query) ||
    /mutation\s*{\s*updateProgress\b/.test(query) ||
    /mutation\s*{\s*updateKYC\b/.test(query) ||
    /{\s*previousEvents\b/.test(query) ||
    /{\s*organizerProfile\b/.test(query) ||
    /{\s*latestArtistAndGallery\b/.test(query) ||
    /{\s*getOrganizerFavorites\b/.test(query) ||
    /mutation\s*{\s*events\b/.test(query) ||
    /mutation\s*{\s*refreshToken\b/.test(query) ||
    /{\s*searchEvents\b/.test(query) ||
    /{\s*getOrganiserName\b/.test(query);

  const operationNames = [
    "login",
    "loginCustomer",
    "registration",
    "verifyOTP",
    "forgotPassword",
    "events",
    "searchEvents",
    "artistForgotPassword",
    "validateForgotPassword",
    "createProps",
    "organisationExistence",
    "refreshToken",
    "resendVerficationLink",
    "setPassword",
    "previousEvents",
    "latestArtistAndGallery",
    "getOrganizerFavorites",
    "organizerProfile",
    "updateKYC",
    "updateProgress",
    "getOrganiserName",
  ];
  const hasOperation = operationNames.includes(operationName);
  return (hasQuery ||
    hasMutation ||
    hasOperation ||
    hasIntrospectionFragment
  );
}

export function URLcheck(url) {
  const urls = [
    "/update-profile",
    "/upload_file",
    "/upload_files",
    "/uploadArtistTracks",
    "/update-avatar",
    "/tickets/csvUpdate",
  ];
  const hasURL = urls.includes(url);
  return hasURL
}

export function ValidateThrottlerGuard(query: string, operationName: string): boolean {
  const introspectionRegex = /IntrospectionQuery/i; // Case-insensitive regex
  const introspectionFragmentsRegex = /FullType|InputValue|TypeRef/i; // Case-insensitive regex

  const hasIntrospectionFragment = introspectionFragmentsRegex.test(query);

  const hasQuery =/{\s*getGallery\b/.test(query);

  const hasMutation = /mutation\s*{\s*getGallery\b/.test(query);

  const operationNames = [
    "getGallery"
  ];

  const hasOperation = operationNames.includes(operationName);
  return hasQuery || hasMutation || hasOperation || hasIntrospectionFragment;
}