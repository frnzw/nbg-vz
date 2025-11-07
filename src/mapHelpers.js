import L from 'leaflet';

/**
 * Adds a Leaflet layer group to the map.
 * @param {L.LayerGroup} layergroup - The layer group to add.
 * @param {L.Map} map - The Leaflet map instance.
 * @returns {void}
 */
export const showLayer = function (layergroup, map) {
  layergroup.addTo(map);
};

/**
 * Removes a Leaflet layer group from the map.
 * @param {L.LayerGroup} layergroup - The layer group to remove.
 * @param {L.Map} map - The Leaflet map instance.
 * @returns {void}
 */
export const hideLayer = function (layergroup, map) {
  layergroup.removeFrom(map);
};

/**
 * Creates a custom Leaflet control for displaying an info box.
 * The info box is toggleable and its content can be updated.
 * @returns {L.Control} A Leaflet control instance.
 */
export const createInfobox = function () {
  // Create a new Leaflet control
  const info = L.control();

  /**
   * Toggles the visibility of the info box content and the toggle button.
   * @private
   */
  const toggle = function () {
    const contentElement = document.getElementById('infoBoxContent');
    const buttonElement = document.getElementById('infoBoxButton');

    // Check the display state of the *button* to infer the state
    if (buttonElement.style.display === 'none') {
      // If button is hidden, content is visible. Hide content, show button.
      buttonElement.style.display = 'flex';
      contentElement.style.display = 'None';
    } else {
      // If button is visible, content is hidden. Show content, hide button.
      buttonElement.style.display = 'none';
      contentElement.style.display = 'block';
    }
  };

  /**
   * Called when the control is added to the map. Creates the DOM elements.
   * @returns {HTMLDivElement} The root DOM element for the control.
   */
  info.onAdd = function () {
    // Create the main container
    const displayDiv = L.DomUtil.create('div', 'info');
    // Create the content container (initially hidden)
    const contentDiv = L.DomUtil.create('div', 'info-content');
    contentDiv.setAttribute('id', 'infoBoxContent');

    // Create the headline element
    const headline = document.createElement('h3');
    headline.setAttribute('id', 'infoBoxHeadline');
    headline.style.margin = '0'; // Remove Standard-Margin of h3
    contentDiv.appendChild(headline);

    // create close button for infobox
    const closeButton = document.createElement('button');
    closeButton.title = 'Close Info-Box';
    closeButton.setAttribute('id', 'infoBoxTextCloseButton');
    closeButton.onclick = async function () {
      toggle(); // Use the same toggle function
    };
    const closeIcon = document.createElement('i');
    closeIcon.classList.add('mdi', 'mdi-close');
    closeIcon.style.paddingLeft = '3px';
    closeIcon.style.fontSize = '24px';
    closeButton.appendChild(closeIcon);
    contentDiv.appendChild(closeButton);

    // create text content for infobox
    const textContent = document.createElement('div');
    textContent.setAttribute('id', 'infoBoxTextContent');
    contentDiv.appendChild(textContent);
    // Add placeholder content
    textContent.innerHTML =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    // hide content when creating control
    contentDiv.style.display = 'None';

    // create info button (the "open" button)
    const button = document.createElement('button');
    button.title = 'Open Info-Box';
    button.setAttribute('id', 'infoBoxButton');
    button.style.display = 'flex'; // Initially visible
    button.onclick = async function () {
      toggle();
    };
    // create info button content: an icon
    const icon = document.createElement('i');
    icon.classList.add('mdi', 'mdi-information-outline');
    icon.style.paddingLeft = '3px';
    icon.style.fontSize = '24px';
    button.appendChild(icon);

    // Add both button and content to the main display div
    displayDiv.appendChild(button);
    displayDiv.appendChild(contentDiv);

    this._div = displayDiv;
    return this._div;
  };

  /**
   * Updates the content of the info box.
   * @param {object} data - The new data to display.
   * @param {string} data.headline - The new headline text.
   * @param {string} data.content - The new HTML content.
   */
  info.update = function (data) {
    const headlineElement = document.getElementById('infoBoxHeadline');
    headlineElement.innerHTML = data.headline;

    const contentElement = document.getElementById('infoBoxTextContent');
    contentElement.innerHTML = data.content;
  };

  return info;
};

/**
 * Creates a button element with an icon that emits a Vue event when clicked.
 * @param {string | number} value - The value to emit.
 * @param {string} title - The button's hover title.
 * @param {string} iconClass - The mdi icon class (e.g., 'mdi-account').
 * @param {string} eventName - The name of the event to emit.
 * @param {function} emitFn - The Vue component's `emit` function.
 * @returns {Array<HTMLElement>} An array containing [HTMLButtonElement, HTMLElement(icon)].
 */
export const createEmitButtonWithIcon = function (
  value,
  title,
  iconClass,
  eventName,
  emitFn
) {
  const button = document.createElement('button');
  button.style.color = '#0078A8'; // Style as a link
  button.style.textDecoration = 'underline';
  button.title = title;
  button.textContent = `${value}`;
  // On click, call the provided emit function with the event name and value
  button.onclick = async function () {
    emitFn(eventName, value);
  };

  const icon = document.createElement('i');
  icon.classList.add('mdi', iconClass);
  icon.style.paddingLeft = '3px';

  return [button, icon];
};

/**
 * Creates a "View Person" link/button and icon.
 * @param {string | number} persId - The person ID.
 * @param {function} emitFn - The Vue component's `emit` function.
 * @returns {Array<HTMLElement>} An array containing [HTMLButtonElement, HTMLElement(icon)].
 */
export const createPersonViewLinkAndIcon = function (persId, emitFn) {
  const [button, icon] = createEmitButtonWithIcon(
    persId,
    'View Person in Person View',
    'mdi-account-outline',
    'person-selected', // Emits 'person-selected' event
    emitFn
  );

  return [button, icon];
};

/**
 * Creates a "View Place" link/button and icon.
 * @param {string | number} stationId - The station/place ID.
 * @param {function} emitFn - The Vue component's `emit` function.
 * @returns {Array<HTMLElement>} An array containing [HTMLButtonElement, HTMLElement(icon)].
 */
export const createPlaceViewLinkAndIcon = function (stationId, emitFn) {
  const [button, icon] = createEmitButtonWithIcon(
    stationId,
    'View Place in Place View',
    'mdi-map-marker',
    'place-selected', // Emits 'place-selected' event
    emitFn
  );

  return [button, icon];
};

/**
 * Creates a standard external link (`<a>` tag) to Wikidata with an icon.
 * @param {string} wdId - The Wikidata ID (e.g., 'Q12345').
 * @returns {Array<HTMLElement>} An array containing [HTMLAnchorElement, HTMLElement(icon)].
 */
export const createWikidataLinkAndIcon = function (wdId) {
  const a = document.createElement('a');
  const linkText = document.createTextNode(wdId);
  a.appendChild(linkText);
  a.title = 'Link to Wikidata Page';
  a.href = `https://www.wikidata.org/wiki/${wdId}`;
  a.target = '_blank'; // Open in new tab
  const icon = document.createElement('i');
  icon.classList.add('mdi', 'mdi-open-in-new');
  icon.style.paddingLeft = '3px';

  return [a, icon];
};

/**
 * Filters an array of markers based on a data key and a list of selected values.
 * @param {Array<any>} selectedValues - An array of values to filter for.
 * @param {Array<L.Marker | L.CircleMarker>} markers - The array of markers to filter. Assumes markers have a `.data` property.
 * @param {string} dataKey - The key within the marker's `.data` object to check.
 * @returns {Array<L.Marker | L.CircleMarker>} The filtered array of markers.
 */
export const filterMarkersByDataKey = function (
  selectedValues,
  markers,
  dataKey
) {
  // If no values are selected, return all markers
  const filtered =
    selectedValues.length == 0
      ? markers
      : markers.filter((marker) =>
          selectedValues.includes(marker.data[dataKey])
        );

  return filtered;
};

/**
 * Convenience wrapper for `getRecordsAroundDate` to get only the last record *before* or *at* the selected date.
 * @param {object} dataMap - The data object from the store (e.g., a person or station object).
 * @param {number} dateSliderValue - The currently selected timestamp from the slider.
 * @param {string} datesSortedKey - The key in `dataMap` that holds the sorted array of timestamps.
 * @param {string} dataMapKey - The key in `dataMap` that holds the data object keyed by timestamp.
 * @param {number} oldDateSliderValue - The previous slider value, used for navigation context.
 * @returns {Array<[number | undefined, object | undefined]>} An array containing [lastRecordedDate, lastRecord].
 */
export const getLastRecordBeforeSelectedDate = function (
  dataMap,
  dateSliderValue,
  datesSortedKey,
  dataMapKey,
  oldDateSliderValue
) {
  // Call the main function with `lastOnly = true`
  const [lastRecordedDate, lastRecordBeforeSelectedTime] = getRecordsAroundDate(
    dataMap,
    dateSliderValue,
    datesSortedKey,
    dataMapKey,
    oldDateSliderValue,
    true // lastOnly
  );

  return [lastRecordedDate, lastRecordBeforeSelectedTime];
};

/**
 * Finds the records immediately before, at, and after a selected date from a sorted time-series object.
 * This is used to display the correct state on the map for a given time.
 * @param {object} dataMap - The data object from the store (e.g., a person or station object).
 * @param {number} dateSliderValue - The currently selected timestamp from the slider.
 * @param {string} datesSortedKey - The key in `dataMap` that holds the sorted array of timestamps (e.g., 'sortedDatesStation').
 * @param {string} dataMapKey - The key in `dataMap` that holds the data object keyed by timestamp (e.g., 'stationsDate').
 * @param {number} oldDateSliderValue - The previous slider value, used for navigation context.
 * @param {boolean} lastOnly - If true, only returns the `lastRecord` and its date.
 * @returns {Array}
 * If `lastOnly` is true: `[lastRecordedDate, lastRecordBeforeSelectedTime]`
 * If `lastOnly` is false: `[lastRecordedDate, lastRecordBeforeSelectedTime, previousRecordBeforeSelectedTime, nextRecordAfterSelectedTime]`
 */
export const getRecordsAroundDate = function (
  dataMap,
  dateSliderValue,
  datesSortedKey,
  dataMapKey,
  oldDateSliderValue,
  lastOnly
) {
  let lastRecordPosition;
  let lastRecordedDate;
  let lastRecordBeforeSelectedTime;

  let previousRecordedDate;
  let previousRecordBeforeSelectedTime;

  let nextRecordedDate;
  let nextRecordAfterSelectedTime;

  // Iterate through the sorted list of timestamps for this data object
  for (const ts of dataMap[datesSortedKey]) {
    if (ts < dateSliderValue) {
      // Keep iterating until we find a timestamp >= selected date
      continue;
    } else if (ts === dateSliderValue) {
      // --- Exact match found on the slider ---
      lastRecordPosition = dataMap[datesSortedKey].indexOf(ts);
      lastRecordedDate = dataMap[datesSortedKey][lastRecordPosition];
      lastRecordBeforeSelectedTime = dataMap[dataMapKey][lastRecordedDate];

      if (lastRecordPosition === 0) {
        // This is the *first* record; there is no previous one.
        previousRecordBeforeSelectedTime = undefined;
        nextRecordedDate = dataMap[datesSortedKey][lastRecordPosition + 1];
        nextRecordAfterSelectedTime = dataMap[dataMapKey][nextRecordedDate];
      } else if (lastRecordPosition === dataMap[datesSortedKey].length - 1) {
        // This is the *last* record; there is no next one.
        previousRecordedDate = dataMap[datesSortedKey][lastRecordPosition - 1];
        previousRecordBeforeSelectedTime =
          dataMap[dataMapKey][previousRecordedDate];
        nextRecordAfterSelectedTime = undefined;
      } else {
        // This is a record in the middle of the timeline.
        previousRecordedDate = dataMap[datesSortedKey][lastRecordPosition - 1];
        previousRecordBeforeSelectedTime =
          dataMap[dataMapKey][previousRecordedDate];
        nextRecordedDate = dataMap[datesSortedKey][lastRecordPosition + 1];
        nextRecordAfterSelectedTime = dataMap[dataMapKey][nextRecordedDate];
      }

      break; // Found our data, stop iterating
    } else {
      // --- No exact match, the current `ts` is greater than slider value -> it is the *next* record ---
      // This means the slider is between two records. We want the *previous* one as the "last before" the selected timestamp.

      // if ts > dateSliderValue but also only value? -> do not show marker
      if (dataMap[datesSortedKey].length === 1) {
        // Only one record, and it's in the future. Show nothing.
        lastRecordBeforeSelectedTime = undefined;
        previousRecordBeforeSelectedTime = undefined;
        nextRecordedDate = undefined;
        nextRecordAfterSelectedTime = undefined;
      } else {
        // The "last record" is the one *before* the current `ts`
        lastRecordPosition = dataMap[datesSortedKey].indexOf(ts) - 1;
        lastRecordedDate = dataMap[datesSortedKey][lastRecordPosition];
        lastRecordBeforeSelectedTime = dataMap[dataMapKey][lastRecordedDate];

        // Get the record before that one
        previousRecordedDate = dataMap[datesSortedKey][lastRecordPosition - 1];
        previousRecordBeforeSelectedTime =
          dataMap[dataMapKey][previousRecordedDate];

        if (lastRecordPosition === dataMap[datesSortedKey].length - 1) {
          // This should be logically covered by the `ts === dateSliderValue` case,
          // but as a safeguard, if we are at the last record.
          nextRecordedDate = undefined;
          nextRecordAfterSelectedTime = undefined;
        } else {
          // The "next record" is the `ts` we are currently on
          nextRecordedDate = dataMap[datesSortedKey][lastRecordPosition + 1];
          nextRecordAfterSelectedTime = dataMap[dataMapKey][nextRecordedDate];
        }
      }

      break; // Found our data, stop iterating
    }
  }

  // special rule for navigating backwards on slider:
  // only set nextStation if it was visible on the date user is navigating from
  // might need to move this out of generalized function some time in the future
  if (nextRecordedDate && oldDateSliderValue) {
    // If the next record is *after* the date we were just on,
    // don't show it (prevents "look-ahead" when moving slider left).
    if (nextRecordedDate > oldDateSliderValue) {
      nextRecordAfterSelectedTime = undefined;
    }
  }

  // Return based on the `lastOnly` flag
  if (lastOnly) {
    return [lastRecordedDate, lastRecordBeforeSelectedTime];
  } else {
    return [
      lastRecordedDate,
      lastRecordBeforeSelectedTime,
      previousRecordBeforeSelectedTime,
      nextRecordAfterSelectedTime,
    ];
  }
};

/**
 * Creates a Leaflet CircleMarker with a dynamically scaled radius.
 * @param {object} station - The station object from the store (must have .lat, .long, .stationId).
 * @param {number | undefined} lastPersCountBeforeSelectedTime - The count used for scaling.
 * @param {number} minPersCountAllStations - The global minimum count for scaling.
 * @param {string} [customColor='red'] - The color for the marker.
 * @param {boolean} [fill=true] - Whether to fill the circle.
 * @param {boolean} [stroke=true] - Whether to draw the circle's outline.
 * @param {number} [baseRadius=1] - The base radius for the scaling calculation.
 * @param {number | null} [scaleToZoom=null] - If provided, scales the radius by (20 - zoomLevel): An experimental scaling approach.
 * @returns {L.CircleMarker | undefined} A Leaflet CircleMarker, or undefined if no data.
 */
export const createCircleMarker = function (
  station,
  lastPersCountBeforeSelectedTime,
  minPersCountAllStations,
  customColor = 'red',
  fill = true,
  stroke = true,
  baseRadius = 1,
  scaleToZoom = null
) {
  let radiusScaled;
  let strokeColor;
  let fillColor;

  // Only create a marker if we have data for the selected time.
  if (lastPersCountBeforeSelectedTime) {
    // we have data

    if (lastPersCountBeforeSelectedTime === 0) {
      // minimal value and 'negative' brushing for known values of zero
      radiusScaled = 1;
      strokeColor = 'grey';
      fillColor = 'grey';
    } else {
      // Calculate radius using Flannery scaling for perceptual accuracy
      radiusScaled = scaleRadiusProportionalFlannery(
        parseInt(lastPersCountBeforeSelectedTime),
        minPersCountAllStations,
        baseRadius
      );

      strokeColor = customColor;
      fillColor = customColor;
    }

    // Create the Leaflet circle marker
    const circle = L.circleMarker([station.lat, station.long], {
      stroke: stroke,
      color: strokeColor,
      weight: 0.5,
      fill: fill,
      fillColor: fillColor,
      fillOpacity: 0.2,
      // Optionally scale radius based on zoom level
      radius: scaleToZoom ? radiusScaled / (20 - scaleToZoom) : radiusScaled,
    });

    // Attach relevant data for popups or filtering
    // more specific data will be attached in calling functions
    circle.data = {
      stationId: station.stationId,
    };

    return circle;
  } else {
    // Warn if called without data
    console.warn(
      `Called createCircleMarker for station ${station.stationId} without data!`
    );
    return undefined;
  }
};

/**
 * Proportional Transformation of 2D Symbols as described by Barvir, Holub and Vondrakova (2025).
 * @param {number} value - The data value to scale.
 * @param {number} minValue - The minimum value in the dataset (for ratio).
 * @param {number} minRadius - The radius corresponding to the minimum value.
 * @returns {number} The calculated radius.
 * @see Barvir, R., Holub, M., & Vondrakova, A. (2025). Proportional Symbol Maps: Value-Scale Types, Online Value-Scale Generator and User Perspectives. ISPRS International Journal of Geo-Information, 14(9), 340. https://doi.org/10.3390/ijgi14090340
 */
export const scaleRadiusProportional = function (value, minValue, minRadius) {
  return Math.pow(value / minValue, 0.5) * minRadius;
};

/**
 * Proportional Transformation of 2D Symbols with Flannery-Compensation as described by Barvir, Holub and Vondrakova (2025).
 * This adjusts for human perceptual underestimation of larger circles.
 * @param {number} value - The data value to scale.
 * @param {number} minValue - The minimum value in the dataset (for ratio).
 *CH @param {number} minRadius - The radius corresponding to the minimum value.
 * @returns {number} The calculated, perceptually-adjusted radius.
 * @see Barvir, R., Holub, M., & Vondrakova, A. (2025). Proportional Symbol Maps: Value-Scale Types, Online Value-Scale Generator and User Perspectives. ISPRS International Journal of Geo-Information, 14(9), 340. https://doi.org/10.3390/ijgi14090340
 */
export const scaleRadiusProportionalFlannery = function (
  value,
  minValue,
  minRadius
) {
  return 1.0083 * Math.pow(value / minValue, 0.5716) * minRadius;
};
