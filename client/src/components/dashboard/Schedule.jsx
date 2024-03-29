// Schedule.jsx
// Main dashboard panel for calendar view

import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";

import { useDataContext } from "../contextproviders/DataContext";
import { useModal } from "../contextproviders/ModalProvider.jsx";

import { UPDATE_EVENT } from "../../utils/mutations.js";

import { Responsive, WidthProvider } from "react-grid-layout";
const ResponsiveGridLayout = WidthProvider(Responsive);
import LoadingSpinner from "../other/LoadingSpinner.jsx";
import EventDetails from "../dashboard/EventDetails.jsx";

import {
  adjustOverlappingEvents,
  buildEventBox,
  formatTime,
  calculateSleepingHoursPixelHeights,
} from "../../utils/scheduleUtils.js";

// Import react-grid-layout styles
import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";

const Schedule = ({ refreshResponsiveGrid }) => {

  // Initialize the schedule grid container reference for setting background
  const scheduleGridContainer = useRef(null);

  const {
    events,
    selectedDate,
    eventsRefetch,
    scheduleSpinnerStyle,
    fetchedSettings,
    responsiveGridTimestampKey,
    isMobileView
  } = useDataContext();

  // Initialize the modal context for displaying event details
  const { openModal } = useModal();

  // Initialize the updateEvent mutation
  const [updateEvent] = useMutation(UPDATE_EVENT);

  const [isLoading, setIsLoading] = useState(true);
  const [currentLayout, setCurrentLayout] = useState([]);
  const [eventBoxProps, setEventBoxProps] = useState([]);
  const [allDayEvents, setAllDayEvents] = useState([]);
  const [movedAllDayEventId, setMovedAllDayEventId] = useState(null);

  // Initialize variables for the selected date and the next day
  // TODO: Can I just use the selectedDate/tomorrowDate from the context?
  const displayDate = new Date(selectedDate);
  displayDate.setHours(0, 0, 0, 0);
  const tomorrowDate = new Date(displayDate);
  tomorrowDate.setDate(displayDate.getDate() + 1);

  // Build the initial layout
  const buildLayout = (events) => {
    const initialLayout = [];
    setAllDayEvents([]);
    setCurrentLayout([]);
    events.map((event) => {
      if (event.isAllDay) {
        setAllDayEvents((prevAllDayEvents) => [...prevAllDayEvents, event]);
      } else {
        const { adjustedBoxHeight, adjustedBoxPosition, className } =
          buildEventBox(event, displayDate);

        // Add the event to the initial layout
        initialLayout.push({
          i: event._id,
          w: 6,
          h: adjustedBoxHeight,
          x: 0,
          y: adjustedBoxPosition,
        });

        // Add the event to the event box props for styling
        setEventBoxProps((prevEventBoxProps) => [
          ...prevEventBoxProps,
          { event, className },
        ]);
      }
    });

    // Adjust overlapping events before setting the layout
    setCurrentLayout(adjustOverlappingEvents(initialLayout, events));

    // Refresh the responsive grid
    refreshResponsiveGrid("initial");
  };

  // Handle clicking on an event (opens event details modal)
  const handleEventClick = (event) => {
    openModal(
      <EventDetails
        eventId={event._id}
        eventTitle={event.title}
        eventType={event.type}
        eventSubtype={event.subtype}
        eventDescription={event.details}
        eventStart={event.eventStart}
        eventEnd={event.eventEnd}
        eventLocation={event.location}
        eventLinks={event.links}
        eventFiles={event.files}
        eventPriority={event.priority}
        eventIsAllDay={event.isAllDay}
        eventReminderTime={event.reminderTime}
        eventCompleted={event.completed}
        eventSubtypes={fetchedSettings?.eventSubtypes}
        eventsRefetch={eventsRefetch}
        showStats={fetchedSettings?.showStats}
        refreshResponsiveGrid={refreshResponsiveGrid}
      />
    );
  };

  // Handle changes to the event layout
  const handleEventChange = async (layout) => {
    // Iterate through each moved event
    for (const movedEvent of layout) {
      const eventId = movedEvent.i;

      // Find the corresponding event in the events array
      const eventToUpdate = events.find((event) => event._id === eventId);

      if (eventToUpdate) {
        // Calculate new start time and duration based on the moved layout
        const newStartTimeMinutes = movedEvent.y * 30; // Each row represents 30 minutes
        const newEndTimeMinutes = newStartTimeMinutes + movedEvent.h * 30;

        const updatedEventStart = new Date(selectedDate);
        const updatedEventEnd = new Date(selectedDate);

        // Add minutes to the start and end times
        updatedEventStart.setMinutes(newStartTimeMinutes);
        updatedEventEnd.setMinutes(newEndTimeMinutes);

        // Update the event in the database
        try {
          await updateEvent({
            variables: {
              eventId: eventToUpdate._id,
              title: eventToUpdate.title,
              type: eventToUpdate.type,
              subtype: eventToUpdate.subtype,
              details: eventToUpdate.details,
              eventStart: updatedEventStart,
              eventEnd: updatedEventEnd,
              location: eventToUpdate.location,
              links: eventToUpdate.links,
              files: eventToUpdate.files,
              priority: eventToUpdate.priority,
              isAllDay: false,
              reminderTime: eventToUpdate.reminderTime,
              completed: eventToUpdate.completed,
            },
          });
        } catch (error) {
          console.error("Error updating event:", error);
        }
      }
    }
  };

  // Store all-day event ID when dragging starts
  const handleAllDayEventDragStart = (e) => {
    setMovedAllDayEventId(e.target.dataset.eventId);
  };

  const handleAllDayEventDrop = (layout, _event) => {

    // Find the layout item that was dropped
    for (const key in layout) {
      if (layout[key].i === "__dropping-elem__") {
        layout[key].i = movedAllDayEventId;
        break;
      }
    }

    // Clear the moved all-day event ID
    setMovedAllDayEventId(null);

    // Handle the event change
    handleDragResizeStop(layout);
  };

  // Handle dragging/resizing an event
  const handleDragResizeStop = (layout) => {

    // Adjust overlapping events before handling the change
    const adjustedLayout = adjustOverlappingEvents(layout, events);

    // Update the database with the new layout
    handleEventChange(adjustedLayout);

    // Set the current layout to the adjusted layout
    setCurrentLayout(adjustedLayout);

    // Refresh the responsive grid
    refreshResponsiveGrid("change");
  };

  // Calculate the pixel heights corresponding to user's sleeping hours and set the background
  useEffect(() => {
    if (scheduleGridContainer.current) {
      const {
        firstBlockPixelHeight,
        secondBlockPixelHeight,
        thirdBlockPixelHeight,
        fourthBlockPixelHeight,
      } = calculateSleepingHoursPixelHeights(fetchedSettings, selectedDate);

      // Set style property for the schedule grid container background
      const sleepHoursBackground = `
        repeating-linear-gradient(
          var(--main-separator-color) 0 1px,
          transparent 1px 40px
        )
        0 0 / 100% 40px,
        url("/schedule_hours.png") left center / contain no-repeat,
        linear-gradient(to bottom,
          ${
            firstBlockPixelHeight !== 1
              ? `transparent ${firstBlockPixelHeight}px,`
              : ""
          }
          ${firstBlockPixelHeight !== 1 ? `transparent 1px,` : ""}
          ${
            firstBlockPixelHeight !== 1
              ? `var(--schedule-sleep-background-color) 1px,`
              : ""
          }
          ${
            firstBlockPixelHeight
              ? `var(--schedule-sleep-background-color) ${secondBlockPixelHeight}px,`
              : ""
          }
          ${
            firstBlockPixelHeight
              ? `var(--schedule-sleep-background-color) 1px,`
              : ""
          }
          ${firstBlockPixelHeight ? `transparent 1px,` : ""}
          ${
            thirdBlockPixelHeight
              ? `transparent ${thirdBlockPixelHeight}px,`
              : ""
          }
          ${thirdBlockPixelHeight ? `transparent 1px,` : ""}
          ${
            thirdBlockPixelHeight
              ? `var(--schedule-sleep-background-color) 1px,`
              : ""
          }
          ${
            thirdBlockPixelHeight
              ? `var(--schedule-sleep-background-color) ${fourthBlockPixelHeight}px,`
              : ""
          }
          ${thirdBlockPixelHeight ? `transparent 1px,` : ""}
          transparent)
      `;
      scheduleGridContainer.current.style.background = sleepHoursBackground;
    }
  }, []);

  // Build the initial layout at component mount or when the selected date changes
  useEffect(() => {
    const initializeSchedule = () => {
      setIsLoading(true);
      buildLayout(events);
      setIsLoading(false);
    };

    initializeSchedule();
  }, [events, selectedDate]);

  return (
    <>
      <div className="schedule-filler-jg"></div>
      <div
        key={`random-key-${Math.floor(Math.random() * 1000000)}`}
        className="schedule-all-day-toolbox-jg"
      >
        {allDayEvents.map((event) => {
          console.log("[Schedule.jsx] allDayEvents.map() - event:", event);
          return (
            <div
              key={event._id}
              data-event-id={event._id}
              draggable="true"
              onDragStart={handleAllDayEventDragStart}
              title={event.title}
              className={`schedule-event-all-day-box-jg schedule-event-box-open-jg schedule-event-${event.priority.toLowerCase()}-box-${event.type.toLowerCase()}-open-jg`}
            >
              <p
                onClick={() => handleEventClick(event)}
                className="schedule-all-day-event-name-jg prevent-drag-jg"
              >
                {event.title}
              </p>
            </div>
          );
        })}
      </div>
      <div
        ref={scheduleGridContainer}
        className="schedule-container-jg grid-container-background-jg"
      >
        {isLoading ? (
          <LoadingSpinner
            spinnerStyle={scheduleSpinnerStyle}
            spinnerElWidthHeight="100px"
          />
        ) : (
          <ResponsiveGridLayout
            key={responsiveGridTimestampKey}
            className="layout"
            layouts={{
              lg: currentLayout,
              md: currentLayout,
              sm: currentLayout,
              xs: currentLayout,
              xxs: currentLayout,
            }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 }}
            compactType={null}
            draggableHandle={isMobileView ? ".schedule-drag-handle-jg" : ""}
            draggableCancel=".prevent-drag-jg"
            rowHeight={30}
            maxRows={48}
            containerPadding={[10, 5]}
            margin={[5, 10]}
            resizeHandles={["n", "s"]}
            allowOverlap={true}
            onDragStop={handleDragResizeStop}
            onResizeStop={handleDragResizeStop}
            isDroppable={true}
            onDrop={handleAllDayEventDrop}
            useCSSTransforms={false}
          >
            {events.map((event) => {
              if (event.isAllDay) return null;

              const matchingProp = eventBoxProps.find(
                (eventBoxProp) => eventBoxProp.event._id === event._id
              );

              const className = matchingProp ? matchingProp.className : "";

              return (
                <div
                  key={event._id}
                  id={event._id}
                  title={`${formatTime(new Date(event.eventStart))} - ${
                    event.title
                  }`}
                  className={className}
                >
                  <p
                    className="schedule-event-name-jg prevent-drag-jg"
                    onClick={() => handleEventClick(event)}
                  >
                    {formatTime(new Date(event.eventStart))} - {event.title}
                  </p>
                  <span className="material-symbols-outlined schedule-drag-handle-jg">
                    drag_indicator
                  </span>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>
    </>
  );
};

export default Schedule;
