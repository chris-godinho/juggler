// DashboardHeader.jsx
// Displays the dashboard header, including the date, percentage, and buttons for adding events and opening the user menu

import { useState, useEffect, useRef } from "react";

import { useDataContext } from "../contextproviders/DataContext";
import { useModal } from "../contextproviders/ModalProvider.jsx";

import Flatpickr from "react-flatpickr";
// Import default styles for flatpickr
import "flatpickr/dist/themes/dark.css";

import NewEvent from "./NewEvent.jsx";
import UserMenu from "../usermenu/UserMenu.jsx";
import SidePanelBrand from "./SidePanelBrand.jsx";
import SidePanelMenu from "./SidePanelMenu.jsx";
import DefaultProfilePicture from "../other/DefaultProfilePicture.jsx";

import { findDisplayPercentage } from "../../utils/eventUtils.js";

export default function DashboardHeader({ refreshResponsiveGrid }) {
  const {
    selectedDate,
    setSelectedDate,
    tomorrowDate,
    setTomorrowDate,
    hasRightSidebar,
    hasLeftSidebar,
    isMobileView,
    eventsRefetch,
    fetchedSettings,
    fetchedEventData,
  } = useDataContext();

  // Open the modal
  const { openModal } = useModal();

  const [unalottedTimePercentage, setUnalottedTimePercentage] = useState(0);
  const [
    unalottedTimePercentageWithSleepingHours,
    setUnalottedTimePercentageWithSleepingHours,
  ] = useState(0);

  // State for the mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ref for the mobile sidebar
  const mobileSidebar = useRef(null);

  const eventTypes = ["Work", "Life"];

  // Find the display percentages for the event types
  const displayPercentages = eventTypes.map((eventType) =>
    findDisplayPercentage(
      eventType,
      fetchedSettings?.ignoreUnalotted,
      fetchedSettings?.percentageBasis,
      fetchedSettings?.viewStyle,
      fetchedEventData?.workPercentage,
      fetchedEventData?.workTaskPercentage,
      fetchedEventData?.workPercentageIgnoreUnalotted,
      fetchedEventData?.workPercentageWithSleepingHours,
      fetchedEventData?.lifePercentage,
      fetchedEventData?.lifeTaskPercentage,
      fetchedEventData?.lifePercentageIgnoreUnalotted,
      fetchedEventData?.lifePercentageWithSleepingHours
    )
  );

  // Update state when the fetched event data changes
  useEffect(() => {
    if (fetchedEventData?.unalottedTimePercentage < 0) {
      setUnalottedTimePercentage(0);
    } else {
      setUnalottedTimePercentage(fetchedEventData?.unalottedTimePercentage);
    }
    if (fetchedEventData?.unalottedTimePercentageWithSleepingHours < 0) {
      setUnalottedTimePercentageWithSleepingHours(0);
    } else {
      setUnalottedTimePercentageWithSleepingHours(
        fetchedEventData?.unalottedTimePercentageWithSleepingHours
      );
    }
  }, [fetchedEventData]);

  // Refresh component when a new event is added
  const handleNewEventModalClose = () => {
    eventsRefetch();
  };

  // Select the previous day
  const selectPreviousDay = (event) => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
    setTomorrowDate(new Date(tomorrowDate.setDate(tomorrowDate.getDate() - 1)));
  };

  // Select the next day
  const selectNextDay = (event) => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
    setTomorrowDate(new Date(tomorrowDate.setDate(tomorrowDate.getDate() + 1)));
  };

  // Toggle the mobile sidebar
  const toggleSidebar = () => {
    mobileSidebar.current.style.left = isSidebarOpen ? "-65%" : "0";
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <header
      className={`dashboard-header-jg ${
        !hasRightSidebar ? "dashboard-header-one-sidebar-left-jg" : ""
      } ${!hasLeftSidebar ? "dashboard-header-one-sidebar-right-jg" : ""}`}
    >
      <div
        className="dashboard-mobile-header-top-brand-jg"
        onClick={toggleSidebar}
      >
        <SidePanelBrand />
      </div>
      <div className="dashboard-mobile-header-top-jg">
        <div className="menu-brand-container-jg">
          <div className="menu-container-jg">
            <svg
              className="menu-icon-jg"
              width="2.5em"
              height="2.5em"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={toggleSidebar}
            >
              <path
                className="menu-icon-bottom-bar-jg"
                d="M4 18L20 18"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="menu-icon-middle-bar-jg"
                d="M4 12L20 12"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="menu-icon-top-bar-jg"
                d="M4 6L20 6"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="mobile-percentages-container-jg">
          {fetchedSettings?.showStats && (
            <>
              <div
                title="Work Percentage"
                className="dashboard-header-mobile-percentage-jg work-text-jg"
              >
                <h2>{displayPercentages[0]}%</h2>
                <p>Work</p>
              </div>
            </>
          )}
          {fetchedSettings?.showStats && !fetchedSettings?.ignoreUnalotted && (
            <div
              title="Unallotted Percentage"
              className="dashboard-header-mobile-percentage-jg grey-text-jg"
            >
              <h2>
                {" "}
                {fetchedSettings?.percentageBasis === "waking"
                  ? unalottedTimePercentage
                  : unalottedTimePercentageWithSleepingHours}
                %
              </h2>
              <p>Unalotted</p>
            </div>
          )}
          {fetchedSettings?.showStats && (
            <>
              <div
                title="Life Percentage"
                className="dashboard-header-mobile-percentage-jg life-text-jg"
              >
                <h2>{displayPercentages[1]}%</h2>
                <p>Life</p>
              </div>
            </>
          )}
        </div>
        <div className="dashboard-header-mobile-button-container-jg">
          <button
            className="round-button-jg life-border-jg life-border-link-jg"
            onClick={() =>
              openModal(
                <NewEvent
                  eventSubtypes={fetchedSettings?.eventSubtypes}
                  handleNewEventModalClose={handleNewEventModalClose}
                  userId={fetchedSettings?.userId}
                  showStats={fetchedSettings?.showStats}
                  refreshResponsiveGrid={refreshResponsiveGrid}
                />
              )
            }
          >
            <svg
              className="add-event-picture-jg"
              xmlns="http://www.w3.org/2000/svg"
              width="512"
              height="512"
              viewBox="0 0 512 512"
              version="1.1"
            >
              <path d="" stroke="none" fillRule="evenodd" />
              <path
                d="M 242.184 209.500 L 242.629 243 205.314 243 L 168 243 168 255.500 L 168 268 205.500 268 L 243 268 243 301.500 L 243 335 256 335 L 269 335 269 301.500 L 269 268 306.500 268 L 344 268 344 255.500 L 344 243 306.686 243 L 269.371 243 269.816 209.500 L 270.260 176 256 176 L 241.740 176 242.184 209.500"
                stroke="none"
                fillRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="dashboard-header-button-container-jg">
        <button
          className="round-button-jg work-border-jg work-border-link-jg"
          onClick={() =>
            openModal(
              <UserMenu
                username={fetchedSettings?.username}
                userId={fetchedSettings?.userId}
                modalContent="UserMenuOptions"
              />
            )
          }
        >
          {fetchedSettings?.profilePictureUrl ? (
            <img
              className="dashboard-profile-picture-jg"
              src={fetchedSettings?.profilePictureUrl || null}
              alt="profile picture"
            />
          ) : (
            <DefaultProfilePicture />
          )}
        </button>
      </div>
      {!hasLeftSidebar && !hasRightSidebar && fetchedSettings?.showStats && (
        <>
          <div className="dashboard-header-percentage-jg work-text-jg">
            <h2>{displayPercentages[0]}%</h2>
            <p>Work</p>
          </div>
        </>
      )}
      <div className="date-percentage-container-jg">
        <div className="selected-date-container-jg">
          <a href="#" onClick={selectPreviousDay}>
            <span className="material-symbols-outlined">
              arrow_back_ios_new
            </span>
          </a>
          <div className="selected-date-box-jg">
            <Flatpickr
              className="selected-date-box-input-jg"
              value={selectedDate}
              options={{
                dateFormat: "l, F j, Y",
                defaultDate: selectedDate,
                onChange: (date) => {
                  setSelectedDate(date[0]);
                  const newTomorrowDate = new Date(date[0]);
                  newTomorrowDate.setDate(newTomorrowDate.getDate() + 1);
                  setTomorrowDate(newTomorrowDate);
                },
              }}
            />
          </div>
          <a href="#" onClick={selectNextDay}>
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </a>
        </div>
        {fetchedSettings?.showStats &&
          !fetchedSettings?.ignoreUnalotted &&
          !isMobileView &&
          fetchedSettings?.viewStyle === "calendar" && (
            <div className="unalotted-percentage-jg">
              <p>
                Unallotted Time:{" "}
                {fetchedSettings?.percentageBasis === "waking"
                  ? unalottedTimePercentage
                  : unalottedTimePercentageWithSleepingHours}
                %
              </p>
            </div>
          )}
      </div>
      {!hasLeftSidebar && !hasRightSidebar && fetchedSettings?.showStats && (
        <>
          <div className="dashboard-header-percentage-jg life-text-jg">
            <h2>{displayPercentages[1]}%</h2>
            <p>Life</p>
          </div>
        </>
      )}
      <div className="dashboard-header-button-container-jg">
        <button
          className="round-button-jg life-border-jg life-border-link-jg"
          onClick={() =>
            openModal(
              <NewEvent
                eventSubtypes={fetchedSettings?.eventSubtypes}
                handleNewEventModalClose={handleNewEventModalClose}
                userId={fetchedSettings?.userId}
                showStats={fetchedSettings?.showStats}
                refreshResponsiveGrid={refreshResponsiveGrid}
              />
            )
          }
        >
          <svg
            className="add-event-picture-jg"
            xmlns="http://www.w3.org/2000/svg"
            width="512"
            height="512"
            viewBox="0 0 512 512"
            version="1.1"
          >
            <path d="" stroke="none" fillRule="evenodd" />
            <path
              d="M 242.184 209.500 L 242.629 243 205.314 243 L 168 243 168 255.500 L 168 268 205.500 268 L 243 268 243 301.500 L 243 335 256 335 L 269 335 269 301.500 L 269 268 306.500 268 L 344 268 344 255.500 L 344 243 306.686 243 L 269.371 243 269.816 209.500 L 270.260 176 256 176 L 241.740 176 242.184 209.500"
              stroke="none"
              fillRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="mobile-sidebar-jg" ref={mobileSidebar}>
        {isMobileView && (
          <>
            <SidePanelBrand />
            <hr className={`side-panel-hr-jg no-stats-hr-jg`} />
            <SidePanelMenu refreshResponsiveGrid={refreshResponsiveGrid} />
          </>
        )}
      </div>
      {isSidebarOpen && (
        <div
          className="mobile-sidebar-overlay-jg"
          onClick={toggleSidebar}
        ></div>
      )}
    </header>
  );
}
