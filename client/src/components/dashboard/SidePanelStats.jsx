// SidePanelStats.jsx

import { useDataContext } from "../contextproviders/DataContext";

import {
  findDisplayPercentage,
  findDisplayText,
} from "../../utils/eventUtils.js";

export default function SidePanelStats({ eventType }) {
  const { fetchedSettings, fetchedEventData, isOneBarLayout } = useDataContext();

  const displayPercentage = findDisplayPercentage(
    eventType,
    fetchedSettings?.statSettings?.ignoreUnalotted,
    fetchedSettings?.statSettings?.percentageBasis,
    fetchedEventData?.workPercentage,
    fetchedEventData?.workPercentageIgnoreUnalotted,
    fetchedEventData?.workPercentageWithSleepingHours,
    fetchedEventData?.lifePercentage,
    fetchedEventData?.lifePercentageIgnoreUnalotted,
    fetchedEventData?.lifePercentageWithSleepingHours
  );

  const displayText = findDisplayText(
    fetchedSettings?.statSettings?.ignoreUnalotted,
    fetchedSettings?.statSettings?.percentageBasis
  );

  return (
    <>
      <div
        className={`side-panel-top-jg ${
          isOneBarLayout
            ? "side-panel-stats-top-one-sidebar-jg"
            : ""
        }`}
      >
        <p
          className={`side-panel-stats-title-jg ${
            isOneBarLayout
              ? "side-panel-stats-title-one-sidebar-jg"
              : ""
          }`}
        >
          {eventType}
        </p>
      </div>
      <div
        className={`side-panel-middle-jg ${
          isOneBarLayout
            ? "side-panel-stats-middle-one-sidebar-jg"
            : ""
        }`}
      >
        <h1>{displayPercentage}%</h1>
      </div>
      <div
        className={`side-panel-bottom-jg ${
          isOneBarLayout
            ? "side-panel-stats-bottom-one-sidebar-jg"
            : ""
        }`}
      >
        <p>{displayText}</p>
      </div>
    </>
  );
}
