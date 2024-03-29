// UserProfile.jsx
// User profile edit page for the User Menu

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";

import { useUserSettings } from "../contextproviders/UserSettingsProvider.jsx";

import Flatpickr from "react-flatpickr";
// Import styles for Flatpickr
import "flatpickr/dist/themes/dark.css";

import { QUERY_USER } from "../../utils/queries";
import { UPDATE_USER, DELETE_USER } from "../../utils/mutations";

import ProfilePictureUpload from "../other/ProfilePictureUpload.jsx";

import Auth from "../../utils/auth";

export default function UserProfile({ username, backToMenu, setUserDeleted }) {

  // Get profile picture upload key from User Settings context
  const { profilePictureUploadKey } = useUserSettings();

  // Define state variable for active screen
  const [profileScreen, setProfileScreen] = useState("UserProfile");

  const logout = (event) => {
    // Log user out and return them to welcome page
    event.preventDefault();
    Auth.logout();
    window.location.href = "/";
  };

  // Define mutations for updating/deleting user
  const [updateUser, { error: updateError }] = useMutation(UPDATE_USER);
  const [deleteUser, { error: deleteError }] = useMutation(DELETE_USER);

  // Query for fetching user data
  const { data: userData, error: userError, refetch: userRefetch } = useQuery(QUERY_USER, {
    variables: { username: username },
  });

  if (userError) {
    console.error("[Welcome.jsx] GraphQL Error:", userError);
    return <div>Error fetching data.</div>;
  }

  const [formData, setFormData] = useState({
    username: userData?.user.username || "",
    email: userData?.user.email || "",
    password: "",
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: userData?.user.birthDate || "",
  });

  // Handle form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

  };

  // Handle form submission
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    // Format birth date for submission
    const formattedBirthDate = new Date(`${formData.birthDate} 00:00`);

    const formattedFormData = {
      ...formData,
      birthDate: formattedBirthDate,
    };

    // Update the database with the new user data
    try {
      const { data } = await updateUser({
        variables: { ...formattedFormData },
      });

      setFormData({
        ...formattedFormData,
        password: "", // Clear the password field
      });

      // Refetch user data
      userRefetch();

      // Move user to confirmation screen
      setProfileScreen("saveConfirmed");

    } catch (e) {
      console.error(e);
    }
  };

  // Handle user deletion request
  const handleDeleteUser = async (event) => {
    event.preventDefault();

    try {

      // Delete the user from the database
      const { success, message } = await deleteUser({
        variables: { username: username },
      });

      // Log user out after deletion
      setUserDeleted(true);

      // Move user to confirmation screen
      setProfileScreen("deleteConfirmed");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-inner-content-jg">
      <div className="user-profile-container-jg">
        <ProfilePictureUpload key={profilePictureUploadKey} />
        <div className="user-profile-info-jg">
          <h1 className="work-text-jg">{username}</h1>
          {profileScreen === "UserProfile" ? (
            <form
              className="user-profile-form-fields-jg"
              onSubmit={handleFormSubmit}
            >
              <input
                className="form-input user-profile-input-jg user-profile-disabled-input-jg"
                placeholder={userData?.user.firstName}
                name="firstName"
                type="text"
                onChange={handleChange}
                disabled
              />
              <input
                className="form-input user-profile-input-jg user-profile-disabled-input-jg"
                placeholder={userData?.user.middleName || "Middle name"}
                name="middleName"
                type="text"
                onChange={handleChange}
                disabled
              />
              <input
                className="form-input user-profile-input-jg user-profile-disabled-input-jg"
                placeholder={userData?.user.lastName || "Last name"}
                name="lastName"
                type="text"
                onChange={handleChange}
                disabled
              />
              <input
                className="form-input user-profile-input-jg"
                placeholder="Change e-mail address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                className="form-input user-profile-input-jg"
                placeholder="Change password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
              <div className="user-profile-datepicker-tray-jg">
                <p className="user-profile-datepicker-label-jg">
                  Date of Birth
                </p>
                <Flatpickr
                  name="birthDate"
                  options={{
                    dateFormat: "m/d/Y",
                    defaultDate: userData?.user.birthDate || "",
                    allowInput: true,
                    closeOnSelect: true,
                    clickOpens: true,
                  }}
                  className="user-profile-datepicker-jg"
                  onChange={(selectedDates, dateString, instance) => {
                    console.log(
                      "[Dashboard.jsx] birthDate onChange:",
                      selectedDates,
                      dateString,
                      instance
                    );
                    handleChange({
                      target: {
                        name: "birthDate",
                        value: dateString,
                      },
                    });
                  }}
                />
              </div>
              <div className="user-profile-button-tray-jg">
                <button className="button-jg" type="submit">
                  Save
                </button>
                <button
                  className="button-jg login-signup-delete-button-jg"
                  onClick={(event) => {
                    event.preventDefault();
                    setProfileScreen("confirmDelete");
                  }}
                >
                  Delete Account
                </button>
              </div>
            </form>
          ) : profileScreen === "saveConfirmed" ? (
            <div className="user-profile-confirm-jg">
              <p>Your profile has been successfully updated.</p>
              <button className="button-jg" onClick={backToMenu}>
                Back
              </button>
            </div>
          ) : profileScreen === "confirmDelete" ? (
            <div className="user-profile-confirm-jg">
              <p>
                Are you sure you want to delete your account? Your profile data
                will be erased.
              </p>
              <p>This action cannot be reversed.</p>
              <div className="user-profile-button-tray-jg">
                <button
                  className="button-jg"
                  onClick={() => setProfileScreen("UserProfile")}
                >
                  Cancel
                </button>
                <button
                  className="button-jg login-signup-delete-button-jg"
                  type="submit"
                  onClick={handleDeleteUser}
                >
                  Delete Account
                </button>
              </div>
            </div>
          ) : (
            <div className="user-profile-confirm-jg">
              <p>Your account has been successfully deleted.</p>
              <p>We hope to see you again.</p>
              <button className="button-jg" type="submit" onClick={logout}>
                Leave
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
