// Settings.jsx
// Settings page for the User Menu

import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";

import { useLayout } from "../contextproviders/LayoutProvider.jsx";
import { useDataContext } from "../contextproviders/DataContext";

import { QUERY_USER } from "../../utils/queries.js";

import WorkLifeSlider from "../settings/WorkLifeSlider";
import SleepDropdownArea from "../settings/SleepDropdownArea";
import LifeActivitiesCheckboxes from "../settings/LifeActivitiesCheckboxes.jsx";
import WorkActivitiesCheckboxes from "../settings/WorkActivitiesCheckboxes.jsx";
import LayoutTable from "../settings/LayoutTable.jsx";
import ColorSchemeTable from "../settings/ColorSchemeTable.jsx";

import AuthService from "../../utils/auth.js";

export default function Settings() {
  // Get layout context for updating view style
  const { changeEventView } = useLayout();

  // Get user profile data
  const userProfile = AuthService.getProfile();

  // Initialize state for Settings active screen
  const [settingsScreen, setSettingsScreen] = useState("stats");

  // Initialize state for active preferred activities
  const [activePreferredActivities, setActivePreferredActivities] =
    useState("work");

  // Initialize state for mobile menu option
  const [mobileMenuOption, setMobileMenuOption] = useState("stats");

  const { formData, setFormData, userSettings } = useDataContext();

  // Initialize state for event subtype form data
  const [eventAddSubtypeFormData, setAddEventSubtypeFormData] = useState({
    subtype: "",
    parentType: "work",
  });
  const [eventRemoveSubtypeFormData, setRemoveEventSubtypeFormData] =
    useState("");
  const [displayAddSubtypeFormError, setDisplayAddSubtypeFormError] =
    useState(false);

  // Initialize state for PWA deferred prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Query for fetching user data
  const { data: userData, error: userError } = useQuery(QUERY_USER, {
    variables: { username: userProfile.data.username },
  });

  if (userError) {
    console.error("[Settings.jsx] GraphQL Error:", userError);
    return <div>Error fetching data.</div>;
  }

  // Set form data after user data is loaded
  useEffect(() => {
    if (userData) {
      const eventSubtypes = userData?.user.eventSubtypes.map(
        ({ subtype, parentType }) => ({ subtype, parentType })
      );

      setFormData({
        user: userSettings,
      });
    }
  }, [userData]);

  // Check for PWA installation before showing install button
  if ("beforeinstallprompt" in window) {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();

      setDeferredPrompt(event);
    });
  }

  // Handle PWA install button click
  const handleInstallButtonClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then((choiceResult) => {
        setDeferredPrompt(null);
      });
    }
  };

  // Handle input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith("checkbox-")) {
      const [_, checkboxCategory, checkboxName] = name.split("-");
      const currentState = formData?.user?.[checkboxCategory]?.[checkboxName];

      setFormData({
        ...formData,
        user: {
          ...formData.user,
          [checkboxCategory]: {
            ...formData?.user?.[checkboxCategory],
            [checkboxName]: !currentState,
          },
        },
      });
    } else if (name.startsWith("eventSubtypes")) {
      setDisplayAddSubtypeFormError(false);

      const [eventSubtypeCategory, eventSubtypeName] = name.split("-");
      const currentSubtypes = formData?.user?.eventSubtypes;

      setAddEventSubtypeFormData({
        ...eventAddSubtypeFormData,
        [eventSubtypeName]: value,
      });
    } else if (name === "removeSubtypes") {
      setRemoveEventSubtypeFormData(value);
    } else if (name === "layoutSettings-viewStyle") {
      changeEventView(value);

      setFormData({
        ...formData,
        user: {
          ...formData.user,
          layoutSettings: {
            ...formData?.user?.layoutSettings,
            viewStyle: value,
          },
        },
      });
    } else if (name === "localizationSettings-timeZone") {
      setFormData({
        ...formData,
        user: {
          ...formData.user,
          localizationSettings: {
            ...formData?.user?.localizationSettings,
            timeZone: parseInt(value, 10),
          },
        },
      });
    } else {
      const [fieldCategory, fieldName] = name.split("-");
      setFormData({
        ...formData,
        user: {
          ...formData.user,
          [fieldCategory]: {
            ...formData?.user?.[fieldCategory],
            [fieldName]: value,
          },
        },
      });
    }
  };

  // Handle add subtype form submission
  const handleAddSubtypeFormSubmit = async (event) => {
    event.preventDefault();

    const { subtype, parentType } = eventAddSubtypeFormData;

    const existingSubtypes = formData?.user?.eventSubtypes;

    const subtypeMatch = existingSubtypes.find(
      (element) => element.subtype === subtype
    );

    if (subtypeMatch) {
      setDisplayAddSubtypeFormError(true);
    } else if (subtype && parentType) {
      const newSubtype = {
        subtype,
        parentType,
      };

      setFormData({
        ...formData,
        user: {
          ...formData.user,
          eventSubtypes: [...formData?.user?.eventSubtypes, newSubtype],
        },
      });
    }
    setAddEventSubtypeFormData({
      subtype: "",
      parentType: "work",
    });
  };

  // Handle remove subtype form submission
  const handleRemoveSubtypeFormSubmit = async (event) => {
    event.preventDefault();

    const currentSubtypes = formData?.user?.eventSubtypes;

    const newSubtypes = currentSubtypes.filter(
      (element) => element.subtype !== eventRemoveSubtypeFormData
    );

    setFormData({
      ...formData,
      user: {
        ...formData.user,
        eventSubtypes: newSubtypes,
      },
    });
  };

  // Handle mobile menu change
  const handleMobileMenuChange = (event) => {
    setMobileMenuOption(event.target.value);
    setSettingsScreen(event.target.value);
  };

  return (
    <div className="modal-inner-content-jg">
      <div className="settings-top-row-jg">
        <h1 className="settings-title-jg">Settings</h1>
        <select
          className="settings-mobile-menu-select-jg"
          name="menu"
          value={mobileMenuOption}
          onChange={handleMobileMenuChange}
        >
          <option value="stats">Stats</option>
          <option value="sleepingHours">Sleeping Hours</option>
          <option value="preferredActivities">Preferred Activities</option>
          <option value="events">Events</option>
          <option value="layout">Layout</option>
          <option value="theme">Theme</option>
          {/*
          <option value="localization">Localization</option>
          <option value="install">Install</option>
          */}
        </select>
      </div>
      <div className="settings-container-jg">
        <div className="settings-sidebar-menu-jg">
          <a
            href="#"
            className={
              settingsScreen === "stats"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("stats")}
          >
            Stats
          </a>
          <a
            href="#"
            className={
              settingsScreen === "sleepingHours"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("sleepingHours")}
          >
            Sleeping Hours
          </a>
          <a
            href="#"
            className={
              settingsScreen === "preferredActivities"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("preferredActivities")}
          >
            Preferred Activities
          </a>
          <a
            href="#"
            className={
              settingsScreen === "events"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("events")}
          >
            Events
          </a>
          <a
            href="#"
            className={
              settingsScreen === "layout"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("layout")}
          >
            Layout
          </a>
          <a
            href="#"
            className={
              settingsScreen === "theme"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("theme")}
          >
            Theme
          </a>
          {/*
          <a
            href="#"
            className={
              settingsScreen === "localization"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("localization")}
          >
            Localization
          </a>
          <a
            href="#"
            className={
              settingsScreen === "install"
                ? "settings-sidebar-item-jg settings-active-submenu-jg"
                : "settings-sidebar-item-jg"
            }
            onClick={() => setSettingsScreen("install")}
          >
            Install
          </a>
          */}
        </div>
        <div className="settings-main-jg">
          {settingsScreen === "stats" ? (
            /* Stats Settings */ <div className="settings-stats-container-jg">
              <label
                key="work-life-optout-jg"
                className="settings-stats-checkbox-jg checkbox-jg"
                title="Uncheck this box to opt out of work-life balance tracking."
              >
                <input
                  type="checkbox"
                  name="checkbox-statSettings-showStats"
                  checked={formData?.user?.statSettings?.showStats || false}
                  onChange={handleInputChange}
                />
                Show Work/Life balance statistics
              </label>
              {formData?.user?.statSettings?.showStats && (
                <>
                  <div title="Use the slider to set your ideal work/life balance.">
                    <h3 className="settings-label-jg">
                      Work/Life balance Goal
                    </h3>
                    <div className="settings-slider-container-jg">
                      <WorkLifeSlider setFormData={setFormData} />
                    </div>
                  </div>
                  <label
                    key="ignore-unalloted-time-jg"
                    className="settings-stats-checkbox-jg settings-stats-checkbox-low-jg checkbox-jg"
                    title="Check this box to ignore unallotted time when calculating your stats (Work and Life time will always add to 100%)."
                  >
                    <input
                      type="checkbox"
                      name="checkbox-statSettings-ignoreUnalotted"
                      checked={
                        formData?.user?.statSettings?.ignoreUnalotted || false
                      }
                      onChange={handleInputChange}
                    />
                    Ignore unallotted time
                  </label>
                  {!formData?.user?.statSettings?.ignoreUnalotted && (
                    <div
                      className="settings-select-line-jg"
                      title="The total number of hours upon which your stats are calculated."
                    >
                      <p className="settings-label-jg">
                        Percentage Calculation Basis
                      </p>
                      <select
                        className="settings-select-jg"
                        name="statSettings-percentageBasis"
                        value={
                          formData?.user?.statSettings?.percentageBasis ||
                          "waking"
                        }
                        onChange={handleInputChange}
                      >
                        <option value="waking">Your waking hours</option>
                        <option value="fullDay">Entire day</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : settingsScreen === "sleepingHours" ? (
            /* Sleeping Hours Settings */ <>
              <p className="settings-top-label-jg sleeping-hours-label-jg">
                Set your regular sleeping hours here.
                {formData?.user?.statSettings?.percentageBasis === "waking"
                  ? " All statistics will ignore those hours when calculated."
                  : ""}
              </p>
              <SleepDropdownArea />
            </>
          ) : settingsScreen === "preferredActivities" ? (
            /* Preferred Activities Settings */ <div className="settings-activities-container-jg">
              <div
                className="settings-select-line-jg settings-select-activities-jg"
                title="The total number of hours upon which your stats are calculated."
              >
                <p className="settings-label-jg settings-select-activities-jg">
                  Event Type
                </p>
                <select
                  className="settings-select-jg"
                  name="subtype"
                  value={activePreferredActivities}
                  onChange={() => {
                    setActivePreferredActivities(
                      activePreferredActivities === "work" ? "life" : "work"
                    );
                  }}
                >
                  <option value="work">Work</option>
                  <option value="life">Life</option>
                </select>
              </div>
              {activePreferredActivities === "work" ? (
                <WorkActivitiesCheckboxes boxSize="small" />
              ) : (
                <LifeActivitiesCheckboxes boxSize="small" />
              )}
            </div>
          ) : settingsScreen === "events" ? (
            /* Events Settings */ <div className="settings-events-container-jg">
              {/*
              <label
                key="work-life-optout-jg"
                className="settings-stats-checkbox-jg checkbox-jg"
                title="If you haven't marked an event as complete by the time it ends, it will be marked as complete automatically. This will not apply to older events."
              >
                <input
                  type="checkbox"
                  name="checkbox-eventSettings-completeAfterEnd"
                  checked={
                    formData?.user?.eventSettings?.completeAfterEnd || false
                  }
                  onChange={handleInputChange}
                />
                Mark events as complete after their end time
              </label>
              */}
              <h3 className="settings-label-jg">Event Categories</h3>
              <p className="settings-label-jg">
                Add or remove categories for your events here.
              </p>
              <form className="settings-events-line-jg">
                <input
                  type="text"
                  name="eventSubtypes-subtype"
                  value={eventAddSubtypeFormData.subtype}
                  className="settings-input-jg"
                  placeholder="New category name"
                  onChange={handleInputChange}
                />
                <select
                  className="settings-select-jg"
                  name="eventSubtypes-parentType"
                  value={eventAddSubtypeFormData.parentType}
                  onChange={handleInputChange}
                >
                  <option value="work">Work</option>
                  <option value="life">Life</option>
                </select>
                <button
                  className="button-jg"
                  type="submit"
                  onClick={handleAddSubtypeFormSubmit}
                >
                  Add
                </button>
              </form>
              {displayAddSubtypeFormError && (
                <p className="settings-events-error-jg work-text-jg">
                  This category already exists.
                </p>
              )}
              <form className="settings-events-line-jg">
                <select
                  className="settings-select-jg"
                  name="removeSubtypes"
                  value={eventRemoveSubtypeFormData}
                  onChange={handleInputChange}
                >
                  <option key="" value=""></option>
                  {formData?.user?.eventSubtypes?.map(
                    ({ subtype, parentType }, index) => (
                      <option key={index} value={subtype}>{`${subtype} (${
                        parentType.charAt(0).toUpperCase() + parentType.slice(1)
                      })`}</option>
                    )
                  )}
                </select>
                <button
                  className="button-jg"
                  type="submit"
                  onClick={handleRemoveSubtypeFormSubmit}
                >
                  Remove
                </button>
              </form>
              <p className="settings-label-jg">
                Note: Removing a category won't delete any events created under
                it, but it will remove the category from the events.
              </p>
            </div>
          ) : settingsScreen === "layout" ? (
            /* Layout Settings */ <div className="settings-layout-container-jg">
              <h3 className="settings-top-label-jg">Dashboard Layout</h3>
              <LayoutTable />
              <div
                className="settings-select-line-jg"
                title="Calendar: Events are displayed as boxes; Task List: Events are displayed as a list."
              >
                <p className="settings-label-jg">View Style</p>
                <select
                  className="settings-select-jg"
                  name="layoutSettings-viewStyle"
                  value={
                    formData?.user?.layoutSettings?.viewStyle || "calendar"
                  }
                  onChange={handleInputChange}
                >
                  <option value="calendar">Calendar</option>
                  <option value="task-list">Task List</option>
                </select>
              </div>
            </div>
          ) : settingsScreen === "theme" ? (
            /* Color Theme Settings */ <div className="settings-theme-container-jg">
              <h3 className="settings-top-label-jg settings-theme-top-label-jg">
                Color Theme
              </h3>
              <ColorSchemeTable cardSize="small" />
            </div>
          ) : settingsScreen === "localization" ? (
            /* Localization Settings */ <div className="settings-localization-container-jg">
              <div
                className="settings-select-line-jg"
                title="Select your local timezone."
              >
                <p className="settings-label-jg">Time Zone</p>
                <select
                  className="settings-select-jg"
                  name="localizationSettings-timeZone"
                  value={formData?.user?.localizationSettings?.timeZone || "0"}
                  onChange={handleInputChange}
                >
                  <option value="-12">UTC-12:00</option>
                  <option value="-11">UTC-11:00</option>
                  <option value="-10">UTC-10:00</option>
                  <option value="-9">UTC-09:00</option>
                  <option value="-8">UTC-08:00</option>
                  <option value="-7">UTC-07:00</option>
                  <option value="-6">UTC-06:00</option>
                  <option value="-5">UTC-05:00</option>
                  <option value="-4">UTC-04:00</option>
                  <option value="-3">UTC-03:00</option>
                  <option value="-2">UTC-02:00</option>
                  <option value="-1">UTC-01:00</option>
                  <option value="0">UTC±00:00 (UTC)</option>
                  <option value="1">UTC+01:00</option>
                  <option value="2">UTC+02:00</option>
                  <option value="3">UTC+03:00</option>
                  <option value="4">UTC+04:00</option>
                  <option value="5">UTC+05:00</option>
                  <option value="6">UTC+06:00</option>
                  <option value="7">UTC+07:00</option>
                  <option value="8">UTC+08:00</option>
                  <option value="9">UTC+09:00</option>
                  <option value="10">UTC+10:00</option>
                  <option value="11">UTC+11:00</option>
                  <option value="12">UTC+12:00</option>
                  <option value="13">UTC+13:00</option>
                  <option value="14">UTC+14:00</option>
                </select>
              </div>
              <div
                className="settings-select-line-jg"
                title="Select your desired date format."
              >
                <p className="settings-label-jg">Date Format</p>
                <select
                  className="settings-select-jg"
                  name="localizationSettings-dateFormat"
                  value={
                    formData?.user?.localizationSettings?.dateFormat ||
                    "mm-dd-yyyy"
                  }
                  onChange={handleInputChange}
                >
                  <option value="mm-dd-yyyy">01/07/1981</option>
                  <option value="dd-mm-yyyy">07/01/1981</option>
                  <option value="yyyy-mm-dd">1981/01/07</option>
                  <option value="yyyy-dd-mm">1981/07/01</option>
                  <option value="month-dd-yyyy">January 7, 1981</option>
                  <option value="dd-month-yyyy">7 January 1981</option>
                </select>
              </div>
              <div
                className="settings-select-line-jg"
                title="Select your desired time format."
              >
                <p className="settings-label-jg">Time Format</p>
                <select
                  className="settings-select-jg"
                  name="localizationSettings-timeFormat"
                  value={
                    formData?.user?.localizationSettings?.timeFormat ||
                    "12-hour"
                  }
                  onChange={handleInputChange}
                >
                  <option value="12-hour">02:25 PM</option>
                  <option value="24-hour">14:25</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="settings-install-container-jg">
              <h3 className="settings-label-jg">Install Juggler</h3>
              <button
                id="pwa-install-button"
                className="button-jg"
                onClick={handleInstallButtonClick}
              >
                Install
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
