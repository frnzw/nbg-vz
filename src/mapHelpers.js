import L from 'leaflet';
// import { useMapStore } from './stores/mapStore';

export const showLayer = function (layergroup, map) {
  layergroup.addTo(map);
};

export const hideLayer = function (layergroup, map) {
  layergroup.removeFrom(map);
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

export const filterByStationId = function (selectedValues, placeMarkers) {
  const filteredByNamesPlaces =
    selectedValues.length == 0
      ? placeMarkers
      : placeMarkers.filter((marker) =>
          selectedValues.includes(marker.data.stationId)
        );
  // console.log(filteredByNames)
  // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

  return filteredByNamesPlaces;
};

export const getLastRecordBeforeSelectedDate = function (
  dataMap,
  dateSliderValue,
  datesSortedKey,
  dataMapKey
) {
  // find last record before selected data of slider
  let lastRecordPosition;
  let lastRecordedDate;
  let lastRecordBeforeSelectedTime;
  for (const ts of dataMap[datesSortedKey]) {
    if (ts < dateSliderValue) {
      continue;
    } else if (ts === dateSliderValue) {
      lastRecordPosition = dataMap[datesSortedKey].indexOf(ts);
      lastRecordedDate = dataMap[datesSortedKey][lastRecordPosition];
      lastRecordBeforeSelectedTime = dataMap[dataMapKey][lastRecordedDate];
      break;
    } else {
      // if ts > dateSliderValue but also only value? -> do not show marker
      if (dataMap[datesSortedKey].length === 1) break;
      // found a date > selected value -> select the date before
      lastRecordPosition = dataMap[datesSortedKey].indexOf(ts) - 1;
      lastRecordedDate = dataMap[datesSortedKey][lastRecordPosition];
      lastRecordBeforeSelectedTime = dataMap[dataMapKey][lastRecordedDate];

      break;
    }
  }

  // all recorded dates are smaller than selected date -> show no data

  return [lastRecordedDate, lastRecordBeforeSelectedTime];
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

    // if (station.stationId === 'Genadendal') {
    //   console.log(`Created Marker:`);
    //   console.log(circle);
    //   console.log(station);
    // }

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
