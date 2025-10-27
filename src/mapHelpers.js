import L from 'leaflet';

export const showLayer = function (layergroup, map) {
  layergroup.addTo(map);
};

export const hideLayer = function (layergroup, map) {
  layergroup.removeFrom(map);
};

export const createInfobox = function () {
  const info = L.control();

  const toggle = function () {
    const contentElement = document.getElementById('infoBoxContent');
    const buttonElement = document.getElementById('infoBoxButton');

    if (buttonElement.style.display === 'none') {
      buttonElement.style.display = 'flex';
      contentElement.style.display = 'None';
    } else {
      buttonElement.style.display = 'none';
      contentElement.style.display = 'block';
    }
  };

  info.onAdd = function () {
    const displayDiv = L.DomUtil.create('div', 'info');
    const contentDiv = L.DomUtil.create('div', 'info-content');
    contentDiv.setAttribute('id', 'infoBoxContent');

    const headline = document.createElement('h3'); // z.B. <h3>
    headline.setAttribute('id', 'infoBoxHeadline');
    headline.style.margin = '0'; // Standard-Margin von h3 entfernen
    contentDiv.appendChild(headline);

    // create close button for infobox
    const closeButton = document.createElement('button');
    closeButton.title = 'Close Info-Box';
    closeButton.setAttribute('id', 'infoBoxTextCloseButton');
    closeButton.onclick = async function () {
      toggle();
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
    textContent.innerHTML =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    // hide content when creating control
    contentDiv.style.display = 'None';

    // create info button
    const button = document.createElement('button');
    button.title = 'Open Info-Box';
    button.setAttribute('id', 'infoBoxButton');
    button.style.display = 'flex';
    button.onclick = async function () {
      toggle();
    };
    // create info button content: an icon
    const icon = document.createElement('i');
    icon.classList.add('mdi', 'mdi-information-outline');
    icon.style.paddingLeft = '3px';
    icon.style.fontSize = '24px';
    button.appendChild(icon);

    displayDiv.appendChild(button);
    displayDiv.appendChild(contentDiv);

    this._div = displayDiv;
    // this.update('');
    return this._div;
  };

  info.update = function (data) {
    const headlineElement = document.getElementById('infoBoxHeadline');
    headlineElement.innerHTML = data.headline;

    const contentElement = document.getElementById('infoBoxTextContent');
    contentElement.innerHTML = data.content;
  };

  info.toggle;

  return info;
};

export const createEmitButtonWithIcon = function (
  value,
  title,
  iconClass,
  eventName,
  emitFn
) {
  const button = document.createElement('button');
  button.style.color = '#0078A8';
  button.style.textDecoration = 'underline';
  button.title = title;
  button.textContent = `${value}`;
  button.onclick = async function () {
    emitFn(eventName, value);
  };

  const icon = document.createElement('i');
  icon.classList.add('mdi', iconClass);
  icon.style.paddingLeft = '3px';

  return [button, icon];
};

export const createPersonViewLinkAndIcon = function (persId, emitFn) {
  const [button, icon] = createEmitButtonWithIcon(
    persId,
    'View Person in Person View',
    'mdi-account-outline',
    'person-selected',
    emitFn
  );

  return [button, icon];
};

export const createPlaceViewLinkAndIcon = function (stationId, emitFn) {
  const [button, icon] = createEmitButtonWithIcon(
    stationId,
    'View Place in Place View',
    'mdi-map-marker',
    'place-selected',
    emitFn
  );

  return [button, icon];
};

export const createWikidataLinkAndIcon = function (wdId) {
  const a = document.createElement('a');
  const linkText = document.createTextNode(wdId);
  a.appendChild(linkText);
  a.title = 'Link to Wikidata Page';
  a.href = `https://www.wikidata.org/wiki/${wdId}`;
  a.target = '_blank';
  const icon = document.createElement('i');
  icon.classList.add('mdi', 'mdi-open-in-new');
  icon.style.paddingLeft = '3px';

  return [a, icon];
};

export const filterMarkersByDataKey = function (
  selectedValues,
  markers,
  dataKey
) {
  const filtered =
    selectedValues.length == 0
      ? markers
      : markers.filter((marker) =>
          selectedValues.includes(marker.data[dataKey])
        );

  return filtered;
};

export const getLastRecordBeforeSelectedDate = function (
  dataMap,
  dateSliderValue,
  datesSortedKey,
  dataMapKey,
  oldDateSliderValue
) {
  const [lastRecordedDate, lastRecordBeforeSelectedTime] = getRecordsAroundDate(
    dataMap,
    dateSliderValue,
    datesSortedKey,
    dataMapKey,
    oldDateSliderValue,
    true
  );

  return [lastRecordedDate, lastRecordBeforeSelectedTime];
};

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

  for (const ts of dataMap[datesSortedKey]) {
    if (ts < dateSliderValue) {
      continue;
    } else if (ts === dateSliderValue) {
      lastRecordPosition = dataMap[datesSortedKey].indexOf(ts);
      lastRecordedDate = dataMap[datesSortedKey][lastRecordPosition];
      lastRecordBeforeSelectedTime = dataMap[dataMapKey][lastRecordedDate];

      if (lastRecordPosition === 0) {
        previousRecordBeforeSelectedTime = undefined;
        nextRecordedDate = dataMap[datesSortedKey][lastRecordPosition + 1];
        nextRecordAfterSelectedTime = dataMap[dataMapKey][nextRecordedDate];
      } else if (lastRecordPosition === dataMap[datesSortedKey].length - 1) {
        previousRecordedDate = dataMap[datesSortedKey][lastRecordPosition - 1];
        previousRecordBeforeSelectedTime =
          dataMap[dataMapKey][previousRecordedDate];

        nextRecordAfterSelectedTime = undefined;
      } else {
        previousRecordedDate = dataMap[datesSortedKey][lastRecordPosition - 1];
        previousRecordBeforeSelectedTime =
          dataMap[dataMapKey][previousRecordedDate];

        nextRecordedDate = dataMap[datesSortedKey][lastRecordPosition + 1];
        nextRecordAfterSelectedTime = dataMap[dataMapKey][nextRecordedDate];
      }

      break;
    } else {
      // if ts > dateSliderValue but also only value? -> do not show marker
      if (dataMap[datesSortedKey].length === 1) {
        lastRecordBeforeSelectedTime = undefined;
        previousRecordBeforeSelectedTime = undefined;
        nextRecordedDate = undefined;
        nextRecordAfterSelectedTime = undefined;
      } else {
        lastRecordPosition = dataMap[datesSortedKey].indexOf(ts) - 1;
        lastRecordedDate = dataMap[datesSortedKey][lastRecordPosition];
        lastRecordBeforeSelectedTime = dataMap[dataMapKey][lastRecordedDate];

        previousRecordedDate = dataMap[datesSortedKey][lastRecordPosition - 1];
        previousRecordBeforeSelectedTime =
          dataMap[dataMapKey][previousRecordedDate];

        if (lastRecordPosition === dataMap[datesSortedKey].length - 1) {
          // no next station recorded
          nextRecordedDate = undefined;
          nextRecordAfterSelectedTime = undefined;
        } else {
          nextRecordedDate = dataMap[datesSortedKey][lastRecordPosition + 1];
          nextRecordAfterSelectedTime = dataMap[dataMapKey][nextRecordedDate];
        }
      }

      break;
    }
  }

  // special rule for navigating backwards on slider:
  // only set nextStation if it was visible on the date user is navigating from
  // might need to move this out of generalized function some time in the future
  if (nextRecordedDate && oldDateSliderValue) {
    if (nextRecordedDate > oldDateSliderValue) {
      nextRecordAfterSelectedTime = undefined;
    }
  }

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
  if (lastPersCountBeforeSelectedTime) {
    // we have data

    if (lastPersCountBeforeSelectedTime === 0) {
      // minimal value and 'negative' brushing for known values of zero
      radiusScaled = 1;
      strokeColor = 'grey';
      fillColor = 'grey';
    } else {
      radiusScaled = scaleRadiusProportionalFlannery(
        parseInt(lastPersCountBeforeSelectedTime),
        minPersCountAllStations,
        baseRadius
      );

      strokeColor = customColor;
      fillColor = customColor;
    }

    const circle = L.circleMarker([station.lat, station.long], {
      stroke: stroke,
      color: strokeColor,
      weight: 0.5,
      fill: fill,
      fillColor: fillColor,
      fillOpacity: 0.2,
      radius: scaleToZoom ? radiusScaled / (20 - scaleToZoom) : radiusScaled,
    });

    // more specific data will be attached in calling functions
    circle.data = {
      stationId: station.stationId,
    };

    return circle;
  } else {
    console.warn('Called createCircleMarker without data!');
    return undefined;
  }
};

/**
 * Proportional Transformation of 2D Symbols as described by Barvir, Holub and Vondrakova (2025).
 * Barvir, R., Holub, M., & Vondrakova, A. (2025). Proportional Symbol Maps: Value-Scale Types, Online Value-Scale Generator and User Perspectives. ISPRS International Journal of Geo-Information, 14(9), 340. https://doi.org/10.3390/ijgi14090340
 */
export const scaleRadiusProportional = function (value, minValue, minRadius) {
  return Math.sqrt(value / minValue) * minRadius;
  // return Math.pow(value / minValue, 0.5) * minRadius;
};

/**
 * Proportional Transformation of 2D Symbols with Flannery-Compensation as described by Barvir, Holub and Vondrakova (2025).
 * Barvir, R., Holub, M., & Vondrakova, A. (2025). Proportional Symbol Maps: Value-Scale Types, Online Value-Scale Generator and User Perspectives. ISPRS International Journal of Geo-Information, 14(9), 340. https://doi.org/10.3390/ijgi14090340
 */
export const scaleRadiusProportionalFlannery = function (
  value,
  minValue,
  minRadius
) {
  return 1.0083 * Math.pow(value / minValue, 0.5716) * minRadius;
};
