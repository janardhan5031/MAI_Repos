import { registerEnumType } from "@nestjs/graphql";

export const ERROR_MESSAGES = {
  ERROR_FETCHING_ORGANISER_NAME: "Failed to Fetch Organiser name for this Event",
  ORGANIZER_EMPTY_NAME: "Organizer userName should not be empty spaced.",
  IMAGES_NOT_FAVORITE: "Sorry, You can't add / remove images to Favorites.",
  INVALID_MEDIA_ID: "Incorrect / Invalid media Id.",
  NO_EVENT_OWNER: "Sorry!, you are not owner of this event.",
  RESTRICT_AGE_RESTRICTION: "Age restriction can't be changed after the venue payment",
  RESTRICT_EVENT_CATEGORY: "Event Category can't be changed after the venue payment",
  RESTRICT_KYC_MANDATORY: "KYC Mandatory can't be changed after the venue payment",
  RESTRICT_EVENT_STATE: "Event type can't be changed after the venue payment",
  RESTRICT_EVENT_NAME: "Event name can't be changed.",
  INVALID_AVATAR: "Invalid Avatar URL",
  ENABLE_MUSIC: "Enable music option",
  VENUE_ID_MISMATCH: "Invalid Venue Id",
  AVATAR_NOT_FOUND: "Avatar not found in the given url.",
  INVALID_ROLE: "User is not an EVENTPERFORMER",
  USER_TERMS_AND_CONDITIONS: "User has not accepted the terms and conditions.",
  ORGANIZER_REGISTRATION: "Unable to save organizer entity",
  INVALID_LOGIN: "Invalid login credentials",
  FETCH_FILE: "Error fetching file from URL",
  TOKEN_RETRIEVAL_ERROR: "Error while retrieving token",
  BANNER_RETRIEVAL_ERROR: "Error while retrieving banner",
  AVATAR_GENDER_UPDATE: "Unable To Update Avatar Gender",
  INVALID_ADVERTSIER_ID: "Advertiser Id not found",
  ALREADY_EVENT_PAYMENT_DONE: "Venue details cannot be updated",
  PREFERRED_NAME_LENGTH: "Preferred Name should be in range of 1-32 characters",
  EVENT_NAME: "Please update the event details",
  INVALID_VENDOR_ID: "Invalid vendor id",
  ERROR_WHILE_GETTING_PREVIOUS_EVENTS: "Error while getting previous events",
  INVALID_LANGUAGE: "Invalid Language",
  INVALID_CATEGORY: "Invalid Category",
  INVALID_ORGANIZER: "Invalid Organizer",
  CHECK_EVENT_ERROR: "ERROR WHILE CHECKING EVENT",
  INVALID_COUNT: "Ticket count must be greater than 0",
  INVALID_PRICE_0: "Ticketprice must be equal to 0",
  INVALID_PRICE: "Ticketprice must be greater than 0",
  INVALID_TRACKS_UPLOAD: "Uploading tracks is not allowed for debate events.",
  ARTIST_PREFERRED_ANME_EXISTS:
    "EVENTPERFORMER with same preferred name already exists",
  ADVERTISER_ID_ALREADY_EXISTS: "Advertiser already exists!",
  INVALID_EVENT_ID: "Invalid/Incorrect Event ID. Re-enter Event ID",
  INVALID_MUSIC_ENABLE: "Music cannot be enabled for debate events.",
  INVALID_VIDEO_ENABLE: "Video cannot be enabled for debate events.",
  INVALID_VIDEO_URL: "Providing a video URL is not allowed for debate events.",
  INVALID_TRANSCATION_ID:
    "Invalid/Incorrect Transcation ID. Re-enter Transcation ID",
  GETTING_ADVERTISER_BEFORE_PAYMENT:
    "You can't get advertisers before completion of venue payment",
  INVALID_AVATAR_CODE: "Invalid Avatar Code.",
  ADDING_ADVERTISER_BEFORE_PAYMENT:
    "you can't add advertiser before completion of venue payment",
  ADDING_DETAILS_AFTER_SALE_START:
    "Event details can't be updated once the ticket sale has been scheduled.",
  INVALID_ACCESS_TOKEN: "Invalid token.",
  ADVERTISER_ALREADY_EXISTS: "Advertiser with the same email already exists",
  ADDING_ADVERTISER_ISSUE: "Error while adding advertiser",
  ADDING_VENDOR_ISSUE: "Error while adding vendor",
  VENDOR_ALREADY_EXISTS: `Vendor with the same email already exists`,
  EMPTY_SLOT_TIME: "Slot time cannot be empty.",
  EMPTY_END_TIME: "End time cannot be empty.",
  EMPTY_START_DATE: "Start date cannot be empty.",
  EMPTY_DURATION: "Duration cannot be empty.",
  ARTIST_PAYMENT_INCOMPLETE:
    "You can't get EVENTPERFORMER before completion of venue payment",
  ARTIST_NOT_FOUND: "Artist not found",
  GETTING_ARTIST_DETAILS_ERROR: "Error while getting EVENTPERFORMER details",
  USER_NOT_ARTIST_ERROR: "User is not an EVENTPERFORMER",
  UPDATE_ARTIST_SUCCESS: "Updated EVENTPERFORMER details successfully",
  UPDATE_ARTIST_ERROR: "Error while updating EVENTPERFORMER details",
  ARTIST_ID_NOT_FOUND: "EVENTPERFORMER ID not found",
  ARTIST_EMAIL_EXISTS_ERROR: "EVENTPERFORMER with the same email already exists",
  ARTIST_REGISTER_SUCCESS:
    "EVENTPERFORMER registered successfully with the following data",
  ONBOARD_ARTIST_ERROR: "Error while onboarding EVENTPERFORMER",
  UPDATE_PASSWORD_SUCCESS: "Updated password successfully",
  SET_PASSWORD_ERROR: "Error while setting password",
  DUPLICATE_EVENT_NAME: "Event with the same name already exists",
  NOT_AN_ORGANIZER: "Sorry you are not an organizer for these event.",
  USER_NOT_FOUND_ERROR: "User ID not found",
  INVALID_FIRST_NAME_LENGTH: "FirstName should be in range of 1-32 characters",
  INVALID_LAST_NAME_LENGTH: "LastName should be in range of 1-32 characters",
  INVALID_FIRST_NAME:
    "Invalid First Name Format. Do not use Numerics and Special Characters.",
  INVALID_LAST_NAME:
    "Invalid Last Name Format. Do not use Numerics and Special Characters.",
  INVALID_EMAIL: "Invalid Email Address Format",
  EMPTY_USERID: "UserId is required",
  INVALID_PASSWORD:
    "Password Invalid format. Password should have a minimum length of 8 characters, must have an uppercase, lowercase, special character and a number.",
  INVALID_MOBILE_NUMBER: "Invalid Mobile Number. Re-enter mobile number.",
  INVALID_COUNTRY_CODE: "Invalid country code",
  EMPTY_ORG_NAME: "Name is required",
  EMPTY_FIRST_NAME: "First name is required",
  EMPTY_PASSWORD: "Password is required.",
  EMPTY_ADDRESS: "Address is required",
  EMPTY_DESCRIPTION: "Description is required",
  EMPTY_LAST_NAME: "Last name is required",
  EMPTY_STATE: "State is required",
  EMPTY_MOBILE: "Mobile Number is required",
  EMPTY_IDENTIFIER: "Identifier is required",
  EMPTY_COUNTRY: "Country is required",
  EMPTY_COUNTRY_CODE: "Country Code is required",
  EMPTY_CITY: "City is required",
  EMPTY_EMAIL: "Email is required",
  EMPTY_ZIPCODE: "Zipcode is required",
  INVALID_EMAIL_FORMAT: "Invalid email address format",
  INVALID_ROLE_ID: "Invalid Role ID Format.",
  NO_UNDERSCORE: "Underscores are not allowed.",
  ORG_NAME_LENGTH: "organization Name should be in range of 1-32 characters",
  ORG_NAME_ERROR_MSG:
    "organization Name should not have special characters, and should contain only alphanumeric characters.",
  INVALID_USERNAME:
    "Invalid Username Format. Username must be between 4 and 16 characters and no special characters.",
  USER_ALREADY_EXISTS:
    "User with same username/email/phone number already exists.",
  ORG_FIRST_NAME:
    "Invalid First Name Format. Do not use Numerics and Special Characters.",
  ORG_LAST_NAME:
    "Invalid Last Name Format. Do not use Numerics and Special Characters.",
  ORG_EMAIL: "Invalid Email Address Format.",
  ORG_MOBILE: "Invalid Mobile Number. Must contains minimum 10 digits.",
  ORG_DESCRIPTION:
    "Description cannot be empty. Fill out the description field to proceed.",
  ORG_ADDRESS:
    "Address should have a minimum 1 and maximum 50-charachter limit.",
  ORG_STATE: "State should have a minimum 1 and maximum 50-charachter limit.",
  ORG_COUNTRY:
    "Country should have a minimum 3 and maximum 50-charachter limit",
  ORG_CITY: " City should have a minimum 1 and maximum 50-charachter limit.",
  ORG_ZIPCODE: "Invalid Zipcode. Zipcode should have 6 digits only",
  OTP_INVALID: "Invalid OTP / OTP Expired. Re-enter valid OTP.",
  EMPTY_OLD_PASSWORD: "Old password should not have empty spaces",
  OTP_INVALID_NUMBER: "OTP should contain numbers only",
  USER_ID_INVALID: "Invalid User ID Format.",
  USER_ALREADY_VERIFIED: "User Credentials have already been verified.",
  TEMP_PASSWORD_EMAIL_SUBJECT: "Temporary Password",
  EMAIL_OTP_ERR: "Error in sending OTP to the email",
  CHECK_EMAIL_OTP: "Please check your mail for OTP",
  EMAIL_ERR: "Unable to send Email to user",
  VERIFY_EMAIL_SUBJECT_ORG_STAFF: "Verification Link",
  MOBILE_OTP_ERR: "Error in sending OTP to the mobile",
  VERIFY_MOBILE: "Please check your registered mobile number for OTP",
  SMS_ERR: "Unable to send SMS to user",
  USER_NOT_VERIFIED_FORGOT_PWD: "User details have not been verified.",
  INV_USR_DETAILS: "Invalid User Details",
  INV_OLD_PWD: "Invalid Old Password. Check and re-enter correct old password.",
  PWD_CHANGE_SUCCESS: "Password Changed Successfully",
  USER_NOT_FOUND: "User not found",
  ID_NOT_VERIFIED: "User Identifiers have not been verified.",
  KYC_ALREADY_DONE: "User KYC has already been completed",
  ACCEPTED_IMAGE_FORMATS: "Accepted File Types are .jpg, .jpeg, .png",
  PRO_PIC_UPDATE_SUCCESS: "Profile Picture updated successfully",
  OTP_ATTEMPTS_EXCEEDED:
    "Number of attempts for OTP has exceeded. Please try again after some time.",
  OTP_EXPIRY_MSG: "One Time Password Invalid / Expired",
  INV_EMAIL_VERIFY_LINK: "Invalid verification email link",
  EMAIL_NOT_FOUND:
    "Incorrect Email Address. Re-enter valid registered email ID.",
  GET_CLIENT_ERR: "Failed to get clients",
  GET_ORG_ERR: "Failed to get organizations",
  GET_ROLES_ERR: "Failed to get Roles",
  UPDATE_ROLE_ERR: "Failed to update Role",
  INV_ROLE_ID: "Invalid role id",
  GET_STAFF_ERR: "failed to get staff",
  KYC_PENDING: "Please complete KYC before proceeding with venue payment",
  // ##################################
  HELLO_FROM_THE_OTHER_SIDE: "HELLO FROM THE OTHER SIDE",
  SELECT_AT_LEAST_ONE_FILE: "Please select at least one file to upload.",
  ERROR_ADDING_ADVERTISER: "Error while adding advertiser",
  ERROR_IN_DELETEING_ADVERTISER_BEFORE_PAYMENT:
    "You can't get advertisers before completion of venue payment",
  ADVERTISER_ALREAY_DELETED: "Advertiser has already been removed",
  FILE_SIZE_EXCEEDED: "File size exceeded.",
  ONLY_AUDIO_FILES_ALLOWED: "Only audio files allowed.",
  IMAGE_SIZE_EXCEEDS_LIMIT: "Image exceeds the maximum allowed size.",
  AUTHORIZATION_REQUIRED: "Authorization Required.",
  ONLY_IMAGE_VIDEO_FILES:
    "Only images and videos file types are allowed. Please ensure uploaded files is image/video.",
  VIDEO_SIZE_EXCEEDS_LIMIT: "Video exceeds the maximum allowed size.",
  AUDIO_FILE_SIZE_EXCEEDED: "Audio File size exceeded.",
  FILE_SIZE_TOO_LARGE: "File size is too large",
  ONLY_IMAGE_FILES_ALLOWED:
    "Only image files are allowed. Please ensure uploaded files is image.",
  AVATAR_URL_NOT_FOUND: "Avatar URL not found.",
  PLEASE_SELECT_A_FILE: "Please select a file",
  FILE_NOT_UPLOADED: "File not uploaded",
  START_TIME_GREATER_THAN_END: "Start time cannot be greater than End time",
  START_TIME_NOT_GREATER_THAN_END:
    "Start time provided should not be greater than or equal to the End time",
  END_DATE_BEFORE_START_DATE: "End date cannot be before the Start date.",
  DURATION_NOT_MATCHING: "Duration is not matching",
  EVENT_DURATION_MINIMUM: "Event Duration must be at least one hour.",
  VENUE_ID_NOT_FOUND: "Venue not found",
  VENUE_BLOCKED_SAME_TIME: "Venue is already booked at the same time",
  START_END_DATE_IN_PAST: "Start and end date cannot be in past",
  START_DATE_BEFORE_END_DATE: "Start date must be before end date",
  ERROR_BOOKING_VENUE: "Error while Booking venue",
  ERROR_INITIATING_VENUE_PAYMENT: "Error while initiating venue payment",
  ERROR_GENERATING_THUMBNAIL: "Error generating thumbnail : ",
  NO_VIDEO_FOUND_WITH_KEY: "No Video Found with the key",
  NO_IMAGE_FOUND_WITH_KEY: "No image Found with the key",
  ERROR_RETRIEVING_ARTIST_TRACKS: "Error while Retrieving EVENTPERFORMER Tracks",
  FAILED_TO_ORGANIZE_TRACK: "Failed to organize Track.",
  ARTIST_TRACK_NOT_FOUND: "EVENTPERFORMER Track not found.",
  VENUE_PAYMENT: "Venu payment has already completed",
  ERROR_DELETING_BANNER: "Error while deleting banner",
  OWNERSHIP_NOT_FOUND: "Ownership Not Found.",
  IDS_NOT_MATCHED: "Id's Not matched.",
  ERROR_UPLOADING_ARTIST_TRACKS: "Error while Uploading EVENTPERFORMER Tracks",
  EVENT_OR_OWNER_NOT_FOUND: "Event / Owner Not Found.",
  ASSET_NOT_FOUND: "Asset not found.",
  ERROR_CREATING_BANNER: "Error while creating banner",
  DOES_NOT_EXIST: "does not exists.",
  USER_NOT_ARTIST: "User is not a EVENTPERFORMER.",
  USER_NOT_ADVERTISER: "User is not a advertiser.",
  INVALID_TYPE: "Invalid Type.",
  CANNOT_ADD_TICKET_BEFORE_PAYMENT:
    "You can't add ticket details before completion of venue payment",
  TICKET_CREATION_EXCEEDS_CAPACITY:
    "Ticket creation exceeds venue capacity limit.",
  ERROR_CREATING_TICKETS: "Error creating tickets",
  ERROR_GETTING_TICKETS: "Error while getting tickets",
  UNABLE_TO_FETCH_EVENT_DETAILS: "Unable to fetch event details",
  CANNOT_GET_ADVERTISERS_BEFORE_PAYMENT:
    "You can't get event before completion of venue payment",
  VENDOR_NOT_FOUND_IN_EVENT: "Vendor not found in this event",
  KIOSKS_ALREADY_ASSIGNED:
    "Sorry!, Given kiosks are already assigned to another vendor",
  KIOSKS_OR_VENUE_NOT_FOUND:
    "Sorry!, Given kiosks are not there in the venue/ Venue not found",
  MISMATCH_DATE_ERROR: "Start date must be before end date.",
  INVALID_DURATION_FORMAT_ERROR:
    "Invalid duration format. Please provide the duration in hours only.",
  EVENTS_SCHEDULED_ERROR:
    "Events cannot be scheduled more than 10 months in advance.",
  CREATE_EVENT_ERROR: "Sorry, you can't create an event for more than 30 days.",
  CREATE_EVENT_PAST_DAYS_ERROR:
    "Sorry, you can't create an event for today or past days.",
  INITIATE_VENUE_PAYMENT_ERROR: "Error while initiating venue payment",
  USER_TIMEZONE_ERROR: "User timezone is required",
  INVALID_TOKEN_ERROR: "Invalid access token",
  BAD_REQUEST: "Bad Request.",
  SOMETHING_WENT_WRONG: "Something went wrong.",
  SPACES_CHARCTERS_ERROR:
    "cannot be empty / contain spaces / atleast 3 charactors in length.",
  INVALID_DATE: "Invalid Date Format.",
  INVALID_NUMBER: "Invalid Number",
  SHORT_VALUE_ERROR: "Value is too short or too long.",
  ACCEPT_PUNCTUATION_ERROR:
    "Description should contain only alphanumeric characters and specific special punctuation characters",
  ARRAY_UNIQUE_ELEMENTS_ERROR:
    "All elements in the array must be unique and the array must not be empty.",
  INVALID_ADVERTISERID: "Invalid AdverstiserID.",
  ERROR_ADVERTISER: "Error while getting advertiser details",
  FIRST_NAME_ERROR: "First Name should not be empty spaced",
  LAST_NAME_ERROR: "Last Name should not be empty spaced",
  PREFERRED_NAME_ERROR: "Preferred Name should not be empty spaced",
  FIRST_NAME_CHARACTERS_ERROR:
    "First Name should be in range of 1-32 characters",
  LAST_NAME_CHARACTERS_ERROR: "Last Name should be in range of 1-32 characters",
  VALID_EMAIL_ERROR: "Please enter valid email address",
  NEW_PASSWORD_ERROR:
    "New Password should be in range of 8-30 characters in length",
  NEW_PASSWORD_SPACE_ERROR: "New password should not have space in middle",
  NEW_PASSWORD_LENGTH_ERROR:
    "New Password should be in range of 8-30 characters in length",
  DESCRIPTION_ERROR:
    "The description should be between 1 and 120 characters in length.",
  ARRAY_STRINGS_ERROR: "Tags array cannot contain empty strings.",
  DUPLICATE_FOUND: "Duplicate tag found: ",
  AVATAR_CODE_ERROR: "Avatar Code cannot be null",
  REFRESH_ERROR: "Unable to refresh",
  EMPTY_LANGUAGE: "Language id can not be empty",
  INVALID_LANGUGAE_ID: "Invalid Language id",
  LANGUAGE_SPACES_ERROR:
    "Language id should not have leading or trailing spaces",
  EVENT_ID_EMPTY_ERROR: "Event ID Cannot be empty.",
  EVENT_ID_TRAILING_SPACES_ERROR:
    "Event id should not have leading or trailing spaces",
  EVENT_NAME_RANGE_ERROR: "Event Name should be in range of 1-32 characters",
  EVENT_NAME_EMPTY_ERROR: "Event Name Can't be empty.",
  LANGUAGES_EMPTY_ERROR: "Languages can not be empty.",
  INVALID_CATEGORY_ID: "Invalid category id",
  CATEGORY_EMPTY_ERROR: "Category id can not be empty",
  CATEGORY_TRAILING_SPACES_ERROR:
    "Category id should not have leading or trailing spaces",
  DESCRIPTION_EMPTY_ERROR:
    "Description should not have front and back spaced and atleast 3 charectors in length.",
  DESCRIPTION_RANGE_ERROR: "Description should be in range of 1-280 characters",
  AGE_LIMIT_ERROR: "Please enter a valid number for age limit",
  COVERPHOTO_ERROR: "CoverPhoto can't be empty / blank spaced",
  THUMBNAIL_EMPTY: "Thumbnail can't be empty / blank spaced",
  INVALID_START_DATE: "Invalid start date format",
  INVALID_END_DATE: "Invalid end date format",
  INVALID_START_TIME: "Invalid start time format.",
  INVALID_END_TIME: "Invalid end time format.",
  VALID_DURATION_ERROR: "Please enter a valid duration",
  SALE_START_ERROR: "Invalid startSaleImmediately format",
  INVALID_NUMBER_OF_TICKETS:
    "Invalid number of tickets/ or invalid format for no.of tickets",
  INVALID_ID: "Invalid _id",
  EMPTY_ID_ERROR: "id can not be empty",
  ID_TRAILING_SPACES: "_id should not have leading or trailing spaces",
  INVALID_URL: "Invalid URL/ URL cannot be empty",
  TRACK_ID_ERROR: "Track Id's Must be unique and not be empty.",
  AGE_LIMIT_REQUIRED_ERROR: "Age limit field is required.",
  TAG_ARRAY_ERROR: "Tags array cannot contain empty strings.",
  INVALID_EVENT_TYPE: "Invalid event type",
  LANGUAGES_ARRAY_ERROR: "Invalid languages in the array.",
  ERROR_CREATING_EVENT: "Error creating event",
  EVENT_ID_ALREADY_DELETED: "Event id provided is already deleted",
  ALREADY_EVENT_CREATED: "Once the event is created it cant be deleted",
  UNAUTHORIZED_EVENT_DELETION: "Not an authorised to delete the event",
  UNAUTHORIZED_EVENT: "Not an authorised to complete venue payment",
  UNABLE_TO_DELETE_EVENT: "Cannot delete the event",
  EVENT_ALREADY_PUBLISHED: "Event has already published.",
  UNABLE_TO_PUBLISH_EVENT:
    "Event can't be published without completing the KYC.",
  UNABLE_TO_PUBLISH_EVENT_DRAFT:
    "Event can't be published without completing the venue payment.",
  ERROR_PUBLISHING_EVENT: "Error in publishing event",
  EVENT_PUBLISHED_ERROR: "Event can't be published without filling.",
  TICKET_SALE_START: "User is not an organiser to start ticket sale.",
  TICKET_SALE_ALREADY_STARTED: "Event ticket sale has already started",
  PUBLISH_EVENT: "Please publish your event.",
  EVENT_TICKET_SALE_STARTED:
    "Event ticket sale can't be started without selecting venue.",
  NO_EVENT_FOUND: "No event found.",
  UNABLE_TO_SCHEDULE_EVENT:
    "Event ticket sale can't be scheduled without verifying the KYC.",
  INVALID_ACCESS_FOR_USER: "User is not an organiser to publish event.",
  UNAUTHORIZED_TO_START_TICKET_SALE:
    "You are unauthorized to start ticket sale.",
  VENUE_NAME_EMPTY: "Venue Name can't be empty / blank spaced",
  VENUE_NAME_NO_SPACES: "Venue Name should not contain front and back spaces",
  VENUE_NAME_ALPHABETS_SPECIAL_CHARS:
    "Venue name should have alphabets and special characters only",
  VALID_USER_COUNT: "Please enter a valid number for userCount",
  VALID_HOLOGRAMS_NUMBER: "Please enter a valid number for holograms",
  VALID_STAGES_NUMBER: "Please enter a valid number for stages",
  VALID_BANNER_NUMBER: "Please enter a valid number for banner",
  VENUE_TYPE_VALID: "Venue type should be one of indoor, outdoor, auditorium",
  KIOSKS_CANNOT_BE_EMPTY: "Kiosks cannot be empty.",
  INVALID_KIOSK_IN_ARRAY: "Invalid Kiosk in the array",
  DUPLICATE_KIOSK_FOUND: "Duplicate Kiosk found",
  TICKET_PRICE_INTEGER: "Ticket price must be an integer.",
  TICKET_COUNT_INTEGER: "Ticket count must be an integer.",
  UNABLE_TO_SALE_START:
    "Sale start date should not be after the event start date",
  START_DATE_TIME_ERROR: "Start date and time can't be in past",
  SCHEDULE_TICKET_SALE_ERROR: "Error in scheduling the ticket sale",
  EVENT_SALE_UPDATE_ERROR: "Event can't be updated with sale start status",
  EVENT_NOT_SCHEDULED: "Event isn't scheduled",
  INVALID_ACCESS_FOR_CREATE_EVENT: "User is not an organiser to create event",
  EVENT_DETAILS_NOT_UPDATED: "Event details can't be updated",
  EVENT_TYPE_NOT_FOUND: "Event Category Not Found.",
  ERROR_CREATE_EVENT: "Error in creating event",
  LANGUAGE_NOT_FOUND: "Sorry, the language you provided is not found.",
  CHECKING_LANGUAGES: "Error while checking languages",
  UNAUTHORIZED_USER: "User does not have access to these API.",
  EVENT_ID_NOT_FOUND: "Event ID not found",
  DELETE_EVENT_OWNER_ERROR: "Sorry you not own this event to delete",
  NOT_ACCEPTED_TA: "User has not accepted the terms and conditions.",
  EVENT_CANCELLED: "This event has already been cancelled",
  TICKET_SALE_NOT_STARTED:
    "This event cannot be cancelled once the ticket sale is started",
  ERROR_DELETE_EVENT: "Error while deleting Event",
  NOT_AUTHORIZED_EVENT_CATEGORIES:
    "Sorry!, you are not authorized to get the event categories.",
  ERROR_ADDING_EVENT_CATEGORY: "Error while adding event category.",
  ERROR_RETRIEVE_LANGUGAES: "Error while getting languages",
  INVALID_ARTIST_ID: "Invalid EVENTPERFORMER id",
  INVALID_SLOT_ID: "Invalid SLOT id",
  ARTIST_ID_EMPTY_ERROR: "EVENTPERFORMER id can not be empty",
  SLOT_ID_EMPTY_ERROR: "Slot id can not be empty",
  DURATION_INVALID: "Invalid Duration",
  SLOT_TIME_ERROR: "slotTime cannot be null",
  START_TIME_ERROR:
    "The start time should be before the end time. Please adjust the times accordingly",
  START_DATE_ERROR: "start date should be within event time",
  EVENT_TIME_ERROR: "startTime & endTime should be within event time",
  ARTIST_ALLOCATED: "EVENTPERFORMER were allocated at this time slot",
  SLOT_ID_NOT_FOUND: "Slot details with the provided id not found",
  ADDING_SLOTS: "Error while adding slots",
  USER_NOT_ORGANISER: "User is not an Organiser",
  UNABLE_ADD_SLOT_ERROR: "Unable to add slot",
  UNBALE_TO_GET_SLOT: "Unable to get slot by id",
  SLOT_ALREADY_DELETED: "The given slot is already deleted",
  FETCH_USER_ERROR: "Unable to fetch the User slots",
  FETCH_EVENT_RECOMMENDATION: "Error while fetching eventRecommendations",
  DATE_ERROR: "Date is not within event start Date and end Date",
  TIME_ERROR: "Time is not within event start Time and end Time",
  INVALID_TIMEZONE: "Invalid timezone provided",
  HAS_NO_ACTIVE_PAYMENT_SESSION: "You have no active payment session",
  PAYMENT_FAILED: "Payment is not succeded.",
  PRICE_NOT_MATCHED: "Ticketprice is not matched.",
  PAYMENT_REFERENCE_NOT_MATCHED: "Reference Id is not matched.",
  HAS_ACTIVE_PAYMENT_SESSION: "You already have active payment session.",
  ERROR_WHILE_GETTING_PAYMENT_ID: "Error while generating reference number",
  DETAILS_UPDATE: "something went wrong while updating the details",
  MEDIA_UPLOAD_IS_NOT_ALLOWED_ONCE_THE_EVENT_SALE_STARTS:
    "Media files cannot be uploaded once the ticket sale has been scheduled.",
  FILE_TYPE_REQUIRED: "File type required.",
  INVALID_FILE_TYPE: "Invalid file type.",
  INVALID_RESOLUTION: "Invalid file resolution. required resolution is",
  ORGANIZER_NOT_FOUND_ERROR: "Organizer not found",
  ERROR_WHILE_UPDATING_TCKTS_WITH_CSV: "Error while updating tickets with csv.",
  ERROR_CSV_HEADERS: 'CSV file does not contain required headers.',
  ERROR_REPLACE_CSV: 'Too many errors found. Please replace the entire CSV file and try again.',
  CSV_VALIDATION_ERROR: "CSV validation failed.",
  NO_CSV_FILE: 'No CSV file uploaded.',
  FILE_SIZE_TOO_LARGE_CSV: "File size is too large. Maximum allowed size is 10 MB.",
  TICKET_COUNT_EMPTY_ERROR: "Invalid ticket count / Ticket count cannot be zero or empty.",
  ONLY_CSV_UPLOAD_ERROR: "Invalid csv file. Only csv file accepted.",
  TICKET_DETAILS_NOT_UPDATED: "After publishing event can't update ticket count."
};
export const SUCCESS_MESSAGE = {
  MEDIA_ADDED_TO_FAVORITE: "Successfully added media to favorites.",
  MEDIA_REMOVED_FROM_FAVORITE: "Successfully removed media from favorites.",
  UPDATE_CUSTOM_AVATAR: "Successfully updated custom avatar.",
  VENDOR_DELETED_FROM_EVENT: "Successfully deleted vendor from event.",
  VENDOR_ALREADY_DELETED: "Vendor is already deleted",
  KIOSKS_ASSIGNED_TO_VENDOR: "Successfully assigned kiosks to vendor",
  KIOSKS_UPDATED_TO_VENDOR: "Successfully updated kiosks to vendor",
  ARTIST_TRACKS_UPDATED_SUCCESSFULLY: "EVENTPERFORMER Tracks updated successfully.",
  ARTIST_TRACKS_ALREADY_UPDATED: "EVENTPERFORMER Tracks already updated.",
  TRACK_ALREADY_EXIST: "Track already exist.",
  BANNERS_ALREADY_UPDATED: "Banners already updated.",
  BANNERS_UPDATED_SUCCESSFULLY: "Banners updated successfully.",
  ASSET_DELETED_SUCCESSFULLY: "Asset Deleted Successfully.",
  ARTIST_TRACK_DELETED_SUCCESSFULLY: "EVENTPERFORMER Track Deleted Successfully.",
  SUCCESSFULLY_CLEARED: "Successfully cleared",
  ARTIST_TRACK_ORGANIZED_SUCCESSFULLY: "EVENTPERFORMER Track Organized Successfully.",
  PAYMENT_TRANSACTION_COMPLETED: "Successfully completed payment transaction",
  ALREADY_CLEARED: "Already cleared",
  VENUE_ID_NOT_FOUND: "Invalid venue Id",
  PAYMENT_ALREADY_DONE: "Payment already done!",
  AVATAR_GENDER_SUCEESFULLY: "Updated Avatar Gender Successfully.",
  ADDED_ADVERTISER: "successfully added advertiser",
  DELETED_ADVERTISER: "successfully deleted advertiser",
  EMAIL_SENT_SUCCESS: "Email sent to the EVENTPERFORMER successfully",
  ARTIST_UPDATE_SUCCESS: "EVENTPERFORMER details updated successfully",
  FILE_UPLOAD_SUCCESS: "Uploaded Asset's Successfully.",
  ASSETS_UPLOAD: "Uploaded Asset's Successfully.",
  ALL_IMAGES_WITHIN_LIMITS: "All images are within size limits.",
  ALL_VIDEOS_WITHIN_LIMITS: "All videos are within size limits.",
  AVATAR_GENDER_SUCCESSFULLY: "Updated Avatar Gender Successfully.",
  KAFKA_CONSUMER_INITIATED_SUCCESSFULLY: "Kafka Consumer Intiated On Topic :",
  KAFKA_PRODUCER_INITIATED_SUCCESSFULLY: "Kafka Producer Intiated On Topic :",
  OWNER_KAFKA_UPDATED_SUCCESSFULLY: "Kafka Consumed and updated ownership",
  ORG_ADDRESS_UPDATED_SUCCESS:
    "organization address details updated successfully",
  DELETED_SUCCESSFULLY: "Deleted Successfully.",
  EVENT_PUBLISHED_SUCCESSFULLY: "Event published succesfully",
  EVENT_SCHEDULED_SUCCESSFULLY: "Event scheduled succesfully",
  EVENT_UPDATED_SUCCESSFULL: "Sucessfully updated event",
  EVENT_CANCELLED_SUCCESSFULLY: "Event cancelled successfully",
  SLOT_UPDATED_SUCCESSFULLY: "Slots updated succesfully.",
  SLOT_ADDED_SUCCESFULLY: "Slot added succesfully.",
  SLOT_DELETED_SUCCESFULLY: "Slot Deleted succesfully.",
  TICKETS_UPDATED: "Tickets updated succesfully."
};
export const LOG_MESSAGES = {
  LOG_EVENT_STATUS_CALL: "To update event status",
  ERROR_FETCHING_VENUES: "Error while fetching the venues",
  ERROR_BOOKING_VENUE: "Error while Booking venue",
  FILE_NOT_UPLOADED: "File not uploaded",
  FAILED_TO_WRITE_INTO_FILE: "Failed to write into file",
  DATA_APPENDED_SUCCESSFULLY: "Data appended to file successfully",
  UPLOAD_FILE_ERROR: "uploadFile error",
  UNABLE_TO_UPLOAD_MEDIA_TRACKS:
    "Sorry!, we are unable to upload Media tracks. Please try again",
  UNABLE_TO_UPLOAD_FILES:
    "Sorry!, we are unable to upload files. Please try again",
  REGISTER_ARTIST_ERROR: "Error while registering artist details",
  UPDATE_PASSWORD_SUCCESS: "Updated password successfully",
  SET_PASSWORD_ERROR: "Error while setting password",
  GETTING_ARTIST_DETAILS_ERROR: "Error while getting artist details",
  DELETING_ADVERTISER_LOG: "Error while removing the advertiser",
  LOGOUT_LOG: "User with email logging out",
  ONBOARD_ARTIST_LOG_ERROR: "error while onboarding ",
  LOGIN_LOG_ERROR: "Error while logging in",
  RESEND_OTP_LOG_ERROR: "Error while Resending otp to mobile",
  LOGIN_LOG: "User with email is successfully logged in eith email",
  UPDATE_ORGANIZER_LOG: "User details to be updated with email",
  LOGOUT_ERROR_LOG: "Error while logging out for user",
  UPDATE_ORGANIZER_LOG_ERROR: "Error while updating the organizer details",
  ONBOARD_ERROR_LOG: "Error while onboarding organizer(Advertiser/Vendor)",
  RESEND_VERIFICATION_LINK_ERROR_LOG: `Error While resendingverificationlink user`,
  AVATAR_GENDER_ERROR_LOG: `Error While updating avatar gender.`,
  ADVERTISER_ERROR_LOG: "Error while getting advertiser details",
  ARTIST_REGISTER_SUCCESS:
    "Artist registered successfully with the following data",
  ORGANIZATION_REGISTERATION_LOG:
    "Organizer registered successfully with following data",
  ORGANIZER_REGISTRATION_ERROR_LOG: "Unable to save organizer entity",
  ORGANIZER_REGISTRATION_LOG_ERROR: "Error while registering organization",
  VERIFY_OTP_LOG: `Successfully verified mobile number with following details `,
  CHANGE_PASSWORD_LOG: `Successfully changed password `,
  UPLOAD_AVATAR_LOG_ERROR: "upload Avatar error",
  VERIFY_OTP_LOG_ERROR: `Error while verifying mobile`,
  CHANGE_PASSWORD_LOG_ERROR: `Error while changing password`,
  FORGOT_PASSWORD_LOG_ERROR: `Error while forgot password`,
  UPDATE_PASSWORD_ERROR_LOG: "error while updating the password",
  REFRESH_TOKEN_LOG_ERROR: "Refresh token error in Auth",
  KYC_CHECK_LOG_ERROR: `error while checking the kyc status`,
  GET_PROFILE_LOG_ERROR: `Error while getting profile details`,
  FORGOT_PASSWORD_LOG: `Successfully initiated forgot password for email`,
  VALIDATE_FORGOT_PASSWORD_LOG: `Successfully validated forgot password for email`,
  VALIDATE_FORGOT_PASSWORD_LOG_ERROR: `Error while validating forgot password`,
  EVENT_SALE_STARTED_SUCCESSFULLY: "Event sale started successfully.",
  EVENT_SALE_ENDED_SUCCESSFULLY: "Event sale ended successfully.",
  WELCOME_ADVERTISER_EMAIL: "SENDING WELCOME MAIL FOR Advertiser.",
  EMAIL_SENT_SUCCESSFULLY: "Successfully send emails to users",
  ERROR_EMAIL: "Error while sending email.",
  WELCOME_ARTIST_EMAIL: "SENDING WELCOME MAIL FOR Artist.",
  WELCOME_ORGANIZER_EMAIL: "SENDING WELCOME MAIL FOR Organizer.",
  VENDOR_ONBOARD: "SENDING VENDOR ONBOARDED MAIL FOR ORGANIZER.",
  ADVERTISER_ONBOARD: "SENDING ADVERTISER ONBOARDED MAIL FOR ORGANIZER.",
  ARTIST_ONBOARD: "SENDING ARTIST ONBOARDED MAIL FOR ORGANIZER.",
  ARTIST_ADDED_TO_EVENT: "SENDING ARTIST ADDED TO EVENT FOR ARTIST",
  ARTIST_EMAIL_SUCCESS: "Successfully senT EMAIL- ARTIST_ADDED_TO_EVENT.",
  ADVERTISER_ADDED_TO_EVENT: "SENDING ARTIST ADDED TO EVENT FOR ADVERTISER",
  ADVERTISER_EMAIL_SUCCESS:
    "Successfully senT EMAIL- ADVERTISER_ADDED_TO_EVENT.",
  ERROR_WHILE_GETTING_ORGANIZER_PROFILE: "Error while getting profile details",
  WELCOME_ADVERTSIER_MAIL: "SENDING WELCOME MAIL FOR Advertiser.",
  CANCEL_MAIL_ORGANIZER: "SENDING CANCEL MAIL FOR ORGANIZER.",
  SENDING_EVENT_CREATION_SUCCESS: "SENDING EVENT_CREATION_SUCCESS email.",
  UPCOMING_EVENT_USERS: "SENDING ARTIST UPCOMING EVENT FOR USER.",
  REMOVING_SPACES_ERROR: "Error while removing spaces.",
  VALIDATING_LANGUAGES_ERROR: "Error while validating languages",
  ORGANIZER_FAVORITES_FETCH_ERROR:
    "ERROR WHILE FETCHING ORGANIZER FAVORITE GALLERY",
  EVENT_TICKET_REQUEST: "SENDING EVENT_TICKET_REQUEST email.",
  ERROR_UPDATING_TICKETS: "Error while updating tickets with CSV.",
  ERROR_CREATING_PRIVATE_TICKET: "Error while creating private ticket",
  CSV_INVITE_REQUEST: "SENDING CSV invite through email.",
  ERROR_WHILE_TICKET_SAVE: "Error While saving ticket.",
};

export const REGEX = {
  //alphanumeric
  ALPHA_NUMERIC: /^[a-zA-Z0-9 ]+$/,
  REPLACE_SPECIAL_CHARACTERS: /[\s]+/g,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@_`^+#$!%()*?&./:;',])[A-Za-z\d@#^`_$+!%*()?&./:;',]{8,}$/,
  MOBILE_NUMBER: /^(\d{10})$/,
  VALIDATE_EMAIL: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
  MIDDLE_SPACES: /^[^\s]+(\s[^\s]+)?$/,
  ALLOWED_CHARS: /^[A-Za-z0-9 !@#$%^&*()\-_=+{}\[\]:;"'<>,.?/~`|\\]+$/,
  CHARACTER_MIDDLE_SPACES: /^([A-Za-z]+\s)*[A-Za-z]+$/,
  ALLOWED_CHARS_VALUE: /\d/,
  SIX_DIGIT_VALUE: /^\d{6}$/,
  OBJECTID_REGEX: /^[0-9a-fA-F]{24}$/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

export const ROLES = {
  EVENT_ORGANIZER: "EVENT_ORGANIZER",
  EVENT_ARTIST: "EVENT_ARTIST",
  EVENT_ADVERTISER: "EVENT_ADVERTISER",
  EVENT_VENDOR: "EVENT_VENDOR",
};

export const EVENT_STATUS = {
  DRAFT: "DRAFT",
  NEW: "NEW",
  PUBLISHED: "PUBLISHED",
  UNPUBLISHED: "UNPUBLISHED",
  SALESTARTED: "SALESTARTED",
  SALESCHEDULED: "SALESCHEDULED",
  LIVE: "LIVE",
  ONGOING: "ONGOING",
  UPCOMING: "UPCOMING",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
};

export const PROGRESS_ORGANIZER = {
  DRAFT: "DRAFT",
  UNPUBLISHED: "UNPUBLISHED",
  TICKETS: "TICKETS",
  ADVERTISER: "ADVERTISER",
  ARTIST: "ARTIST",
  VENDOR: "VENDOR",
  UPLOADBANNER: "UPLOADBANNER",
  ASSIGNBANNER: "ASSIGNBANNER",
  STAGE: "STAGE",
};

export const FORMAT_DATE = {
  DATE_TIME: "%Y-%m-%dT%H:%M:%S.%LZ",
  UTC: "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ",
  MOMENT_FORMAT: "YYYY-MM-DDTHH:mm:ssZ",
  DATE_MOMENT_FORMAT: "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
  DATE_TIME_FORMAT: "YYYYMMDD HH:mm:ss",
  TIME_DATE_FORMAT: "YYYY-MM-DD HH:mm:ss",
  DATE_FROMAT: "YYYY/MM/DD HH:mm:ss",
  DATE: "%Y-%m-%d",
  TIME: ":00.000Z",
  HOUR: "%H",
  DATE_YYMMDD: "YYYY/MM/DD",
  HOUR_MINUTE: "HH:mm",
  DATE_FORMAT: "YYYY-MM-DD",
};

export const INDEX_NAME = {
  ADVERTISER_SEARCH_INDEX: "searchByAdvertiserName",
  ARTIST_SEARCH_INDEX: "searchByArtistName",
  DYNAMIC_SEARCH: "dynamicSearchByName", //BY ORG, ARTIST, EVENT, VENDOR, ADVERTISER NAME
};

export enum EventStatus {
  SALESCHEDULED = "SALESCHEDULED",
  SALESTARTED = "SALESTARTED",
  ONGOING = "ONGOING",
  LIVE = "LIVE",
  COMPLETED = "COMPLETED",
}

export enum Initialstatus {
  UNPUBLISHED = "UNPUBLISHED",
  PUBLISHED = "PUBLISHED",
  DRAFT = "DRAFT",
  NEW = "NEW",
}
registerEnumType(EventStatus, { name: "EventStatus" });
registerEnumType(Initialstatus, { name: "Initialstatus" });

export enum ENUM_ROLE {
  EVENT_ORGANIZER = "EVENT_ORGANIZER",
  EVENT_ARTIST = "EVENT_ARTIST",
  EVENT_ADVERTISER = "EVENT_ADVERTISER",
  EVENT_VENDOR = "EVENT_VENDOR",
}
registerEnumType(ENUM_ROLE, { name: "ENUM_ROLE" });

export const FILE_EXTENSIONS = {
  pdf: "pdf",
  mp4: "mp4",
  mp3: "mp3",
  jpg: "jpg",
  gif: "gif",
  jpeg: "jpeg",
  svg: "svg",
  png: "png",
};

export const MEDIA_TYPE = {
  AUDIO: "AUDIO",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
};

export const SORTBY = {
  LATEST: "LATEST",
  HIGHTOLOW: "HIGHTOLOW",
  LOWTOHIGHT: "LOWTOHIGHT",
};

export const REDIS_KEYS = {
  CACHED_URL: "CACHED_URL",
  BLOCK_VENUE: "BLOCK_VENUE",
  PAYMENT: "PAYMENT-",
};

export const KYC_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
};

export const CONTENT_TYPE = {
  VIDEO_MP4: "video/mp4",
  AUDIO_MP3: "audio/mpeg",
};
export const COMPRESSED_SIZE = {
  VIDEO_THUMBNAIL_SIZE: "320x240",
};

export const ARTIST_PROGRESS = {
  CUSTOM_AVATAR: "CUSTOM_AVATAR",
  UPLOADBANNER: "UPLOADBANNER",
  UPLOADMUSIC: "UPLOADMUSIC",
  ASSIGNBANNER: "ASSIGNBANNER",
  ORGANIZEBANNER: "ORGANIZEBANNER",
  STAGE: "STAGE",
};


export const getArtistProgressBasedOnEventCategory = (category) => {
  switch (category.toUpperCase()) {
    case 'DEBATE':
      return [
        "CREATEAVATAR",
      ];
    default:
      return [
        "CREATEAVATAR",
        "PERFORMANCE",
        "ORGANIZESTAGE",
        "UPLOADBANNER"
      ];
  }
};
export const getOrganizerProgressBasedOnEventCategory = (category) => {
  switch (category.toUpperCase()) {
    case 'DEBATE':
      return [
        "TICKETS",
        "ARTIST",
        "PUBLISHEVENT"
      ];
    default:
      return [
        "TICKETS",
        "ARTIST",
        "ADVERTISERS",
        "VENDORS",
        "ORGANIZEVENUE",
        "PUBLISHEVENT"
      ];
  }
};
export const getOrganizerProgressBasedOnEventCategoryForPublish = (category) => {
  switch (category.toUpperCase()) {
    case 'DEBATE':
      return [
        PROGRESS_ORGANIZER.DRAFT,
        PROGRESS_ORGANIZER.UNPUBLISHED,
        PROGRESS_ORGANIZER.TICKETS,
        PROGRESS_ORGANIZER.ARTIST,
      ];
    default:
      return [
        PROGRESS_ORGANIZER.DRAFT,
        PROGRESS_ORGANIZER.UNPUBLISHED,
        PROGRESS_ORGANIZER.TICKETS,
        PROGRESS_ORGANIZER.ARTIST,
        PROGRESS_ORGANIZER.UPLOADBANNER,
        PROGRESS_ORGANIZER.ASSIGNBANNER,
      ];
  }
};
export const PAYMENT_STATUS = {
  SUCCESS: "SUCCESS",
  ORGANIZEBANNER: "ORGANIZEBANNER",
};
export const VENDOR_PROGRESS = {
  ORGANIZEBANNER: "ORGANIZEBANNER",
  UPLOADBANNER: "UPLOADBANNER",
  ASSIGNEDPRODUCTS: "ASSIGNEDPRODUCTS",
};

export const CSV_FILE_VALIDATIONS = {
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /* If you update the csv requiredHeaders fields please add the headers into app.service validateRow function. */
  debateRequiredHeaders: ['Seat Numbers', 'Email Ids', 'Participant Type'],
  nonDebateRequiredHeaders: ['Email Ids'],
  validParticipantTypes: ['participant', 'guest'],
  MAX_ERRORS: 10
}

export enum UploadFileType {
  PROFILE = "PROFILE",
  COVERPHOTO = "COVERPHOTO",
  THUMBNAIL = "THUMBNAIL",
}

registerEnumType(UploadFileType, {
  name: "UploadFileType",
});

export enum VenueType {
  INDOOR = "indoor",
  OUTDOOR = "outdoor",
  AUDITORIUM = "auditorium",
}

registerEnumType(VenueType, {
  name: "VenueType",
});


export const VALID_SEAT_RANGES = [
  { prefix: 'A', start: 1, end: 20 },
  { prefix: 'B', start: 1, end: 26 },
  { prefix: 'C', start: 1, end: 28 },
  { prefix: 'D', start: 1, end: 34 },
  { prefix: 'E', start: 1, end: 40 },
  { prefix: 'F', start: 1, end: 46 }
];

export const DEBATE_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
}
