// UserSettingsProvider.jsx
// Allows user settings to be shared across the component tree

import { useApolloClient } from "@apollo/client";

import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";

import { QUERY_USER, GET_PRESIGNED_URL } from "../../utils/queries.js";
import { UPDATE_USER_SETTINGS } from "../../utils/mutations.js";

import LoadingSpinner from "../other/LoadingSpinner.jsx";

import { removeTypename } from "../../utils/helpers.js";
import AuthService from "../../utils/auth.js";

const UserSettingsContext = createContext();

// Spinner style for the UserSettingsProvider
const providerSpinnerStyle = {
  spinnerWidth: "100%",
  spinnerHeight: "100vh",
  spinnerElWidthHeight: "150px",
};

export const useUserSettings = () => {
  return useContext(UserSettingsContext);
};

export const UserSettingsProvider = ({ children }) => {
  const [userSettings, setUserSettings] = useState({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [profilePictureUploadKey, setProfilePictureUploadKey] = useState(0);

  const [updateUserSettings] = useMutation(UPDATE_USER_SETTINGS);
  const client = useApolloClient();

  // Get username from the user's profile for the initial query and for the presigned URL
  let username;
  try {
    const userProfile = AuthService.getProfile();
    username = userProfile?.data?.username;
  } catch (error) {
    username = null;
  }

  // Query the user's settings
  const { loading, error, data, refetch } = useQuery(QUERY_USER, {
    skip: !username,
    variables: { username: username },
  });

  // Fetch the presigned URL from S3 for the user's profile picture
  const fetchProfilePictureUrl = async () => {
    const fileName = "profilePicture.jpg";

    try {
      const { data } = await client.query({
        query: GET_PRESIGNED_URL,
        variables: {
          username: username,
          fileName,
        },
      });

      // Update the User Settings context with the new profile picture URL
      setUserSettings((prevSettings) => ({
        ...prevSettings,
        profilePictureUrl: data.generatePresignedUrl,
      }));
    } catch (error) {
      console.error(`Error fetching presigned URL for ${fileName}:`, error);
    }
  };

  // Delete the profile picture URL from the user settings
  const deleteProfilePictureUrl = () => {
    setUserSettings((prevSettings) => ({
      ...prevSettings,
      profilePictureUrl: "",
    }));
  }

  // Set a temporary profile picture URL for the user settings
  const setTemporaryProfilePictureUrl = (url) => {
    setUserSettings((prevSettings) => ({
      ...prevSettings,
      profilePictureUrl: url,
    }));
  }

  // Refreshes the Profile Picture Upload component
  const refreshProfilePictureUpload = () => {
    setProfilePictureUploadKey((prevKey) => prevKey + 1);
  };

  // Store fetched user settings in the context and fetch the presigned URL for user's profile picture
  useEffect(() => {
    if (!loading && !error && data) {
      setUserSettings(data.user);
      setIsLoadingSettings(false);

      fetchProfilePictureUrl();
    }
  }, [loading, error, data]);

  const updateProviderUserSettings = async (newSettings) => {
    // Remove __typename from newSettings for mutation
    const cleanSettings = removeTypename(newSettings);

    setUserSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));

    console.log("[UserSettingsProvider.jsx] updateProviderUserSettings() userSettings:", userSettings);

    try {
      const { data } = await updateUserSettings({
        variables: { ...cleanSettings },
      });

      refetch();

      // Fetch the presigned URL for the user's profile picture after updating the settings
      fetchProfilePictureUrl();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    // Render loading spinner while fetching user settings
    return (
      <div className="dark-background-jg">
        <LoadingSpinner
          spinnerStyle={providerSpinnerStyle}
          spinnerElWidthHeight="100px"
        />
      </div>
    );
  }

  return (
    <UserSettingsContext.Provider
      value={{
        userSettings,
        updateProviderUserSettings,
        fetchProfilePictureUrl,
        deleteProfilePictureUrl,
        setTemporaryProfilePictureUrl,
        refreshProfilePictureUpload,
        profilePictureUploadKey
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};
