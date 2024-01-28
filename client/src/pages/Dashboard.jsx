// Dashboard.jsx

import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import DataContext from "../components/contextproviders/DataContext.jsx";

import Schedule from "../components/dashboard/Schedule";
import LoadingSpinner from "../components/other/LoadingSpinner.jsx";

import { QUERY_USER, QUERY_EVENTS_BY_DATE } from "../utils/queries.js";

import AuthService from "../utils/auth.js";

import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardSidePanel from "../components/dashboard/DashboardSidePanel.jsx";

export default function Dashboard() {
  // Set up date variables for queries and new events
  const localDate = new Date();
  const midnightLocalDate = new Date(localDate);
  midnightLocalDate.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState(midnightLocalDate);

  console.log("[Dashboard.jsx] selectedDate:", selectedDate);

  useEffect(() => {
    eventsRefetch();
  }, [selectedDate]);

  // Get user profile
  const userProfile = AuthService.getProfile();
  const userId = userProfile.data._id;
  const username = userProfile.data.username;

  console.log("[Dashboard.jsx] userProfile:", userProfile);

  const scheduleSpinnerStyle = {
    spinnerWidth: "100%",
    spinnerHeight: "80vh",
    spinnerElWidthHeight: "100px",
  };

  // Query events for the selected date
  const {
    loading: eventsLoading,
    data: eventsData,
    error: eventsError,
    refetch: eventsRefetch,
  } = useQuery(QUERY_EVENTS_BY_DATE, {
    variables: { user: userId, eventStart: selectedDate },
  });

  const {
    loading: userLoading,
    data: userData,
    error: userError,
  } = useQuery(QUERY_USER, {
    variables: { username: userProfile.data.username },
  });

  if (eventsError || userError) {
    console.error("[Schedule.jsx] GraphQL Error:", error);
    return <div>Error fetching data.</div>;
  }

  const events = eventsData?.eventsByDate || [];

  console.log("[Schedule.jsx] events:", events);

  console.log("[Dashboard.jsx] userData:", userData);

  const eventSubtypes = userData?.user.eventSubtypes;

  return (
    <DataContext.Provider
      value={{
        events,
        selectedDate,
        setSelectedDate,
        eventsLoading,
        eventsRefetch,
        userLoading,
        username,
        userId,
        eventSubtypes
      }}
    >
      <main className="main-jg">
        <div className="dashboard-grid-jg">
          <DashboardSidePanel eventType="Work" />
          <div className="dashboard-main-panel-jg">
            <DashboardHeader />
            <div className="schedule-grid-container-jg">
              {eventsLoading || userLoading ? (
                <LoadingSpinner
                  spinnerStyle={scheduleSpinnerStyle}
                  spinnerElWidthHeight="100px"
                />
              ) : (
                <Schedule
                  key={selectedDate.getTime()}
                  events={events}
                  selectedDate={selectedDate}
                  eventSubtypes={eventSubtypes}
                  eventsRefetch={eventsRefetch}
                />
              )}
            </div>
          </div>
          <DashboardSidePanel eventType="Life" />
        </div>
      </main>
    </DataContext.Provider>
  );
}
