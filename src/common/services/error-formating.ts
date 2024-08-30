export const formatError = (error) => {
  // To send error response from Class-Validations
  if (error.extensions?.response) {
    return {
      message: Object.values(error.extensions.response)[1][0],
      code: Object.values(error.extensions.response)[0],
      name: Object.values(error.extensions.response)[2],
    };
  }
  // To send error response from ErrorService module
  if (error.extensions.exception) {
     // Handle ThrottlerException specifically
     if (error.extensions.exception.status === 429 && error.extensions.exception.message.includes('ThrottlerException')) {
      return {
        message: 'Too Many Requests',
        code: 429,
        name: Object.values(error.extensions.exception)[3] || "Bad Request",
      };
    }

    return {
      message: error.message || Object.values(error.extensions.exception)[0],
      code: Object.values(error.extensions.exception)[1] || 400,
      name: Object.values(error.extensions.exception)[3] || "Bad Request",
    };
  }

  // To send default GrapghQl error when field's type / field names are not defined in Input
  return {
    message: error.message,
    code: 400,
    name: "GrapghqQl Error",
  };
};
