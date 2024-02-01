// SidePanelRecommendations.jsx

import { useState, useEffect } from "react";

import { useDataContext } from "../contextproviders/DataContext";

import { findRecommendations } from "../../utils/eventUtils.js";

import {
  workGoalActivities,
  lifeGoalActivities,
} from "../../utils/preferredActivities.js";

export default function SidePanelRecommendations({ eventType }) {
  const {
    isLoadingSettings,
    eventsLoading,
    fetchedSettings,
    fetchedEventData,
    isOneBarLayout,
  } = useDataContext();

  const [recommendationList, setRecommendationList] = useState([]);

  useEffect(() => {
    if (
      !isLoadingSettings &&
      !eventsLoading &&
      eventType &&
      fetchedSettings &&
      fetchedEventData &&
      workGoalActivities &&
      lifeGoalActivities
    ) {
      const resultList = findRecommendations(
        eventType,
        isOneBarLayout,
        workGoalActivities,
        lifeGoalActivities,
        fetchedSettings?.ignoreUnalotted,
        fetchedSettings?.percentageBasis,
        fetchedSettings?.balanceGoal,
        fetchedSettings?.workPreferredActivities,
        fetchedSettings?.lifePreferredActivities,
        fetchedEventData?.workPercentage,
        fetchedEventData?.lifePercentage,
        fetchedEventData?.workPercentageWithSleepingHours,
        fetchedEventData?.lifePercentageWithSleepingHours,
        fetchedEventData?.workPercentageIgnoreUnalotted,
        fetchedEventData?.lifePercentageIgnoreUnalotted
      );
      setRecommendationList(resultList);
      console.log(
        "[SidePanelRecommendations.jsx] recommendationList:",
        recommendationList
      );
    }
  }, [
    isLoadingSettings,
    eventsLoading,
    eventType,
    fetchedSettings,
    fetchedEventData,
    workGoalActivities,
    lifeGoalActivities,
  ]);

  return (
    <>
      {recommendationList.length > 0 && (
        <hr
          className={
            eventType === "Work"
              ? "side-panel-hr-jg work-hr-jg"
              : "side-panel-hr-jg life-hr-jg"
          }
        />
      )}
      <div className="side-panel-recommendation-list-jg">
        {recommendationList.length > 0 && (
          <p
            className={`recommendations-call-action-jg ${
              isOneBarLayout ? "recommendations-call-action-one-sidebar-jg" : ""
            }`}
          >
            You might want to...
          </p>
        )}
        {recommendationList.map((recommendation, index) => (
          <p
            key={index}
            className={`side-panel-recommendation-text-jg ${
              isOneBarLayout ? "recommendation-text-one-sidebar-jg" : ""
            }`}
          >
            {recommendation}
          </p>
        ))}
      </div>
    </>
  );
}
