export const createPersonViewLinkAndIcon = function (persId, emit) {
  const button = document.createElement('button');
  button.style.color = '#0078A8';
  button.style.textDecoration = 'underline';
  button.title = 'View Person in Person View';
  button.textContent = `${persId}`;
  button.onclick = async function () {
    emit('person-selected', persId);
  };

  const icon = document.createElement('i');
  icon.classList.add('mdi', 'mdi-account-outline');
  icon.style.paddingLeft = '3px';

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
