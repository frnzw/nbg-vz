export const createPersonViewLinkAndIcon = function (persId, emit) {
  const button = document.createElement("button");
  button.style.color = "#0078A8";
  button.style.textDecoration = "underline";
  button.title = "View Person in Person View";
  button.textContent = `${persId}`;
  button.onclick = async function () {
    console.log(`Clicked on ${persId}`);
    emit("person-selected", persId);
  };

  const icon = document.createElement("i");
  icon.classList.add("mdi", "mdi-account-outline");
  icon.style.paddingLeft = "3px";

  return [button, icon];
};

export const createWikidataLinkAndIcon = function (wdId) {
  const a = document.createElement("a");
  const linkText = document.createTextNode(wdId);
  a.appendChild(linkText);
  a.title = "Link to Wikidata Page";
  a.href = `https://www.wikidata.org/wiki/${wdId}`;
  a.target = "_blank";
  const icon = document.createElement("i");
  icon.classList.add("mdi", "mdi-open-in-new");
  icon.style.paddingLeft = "3px";

  return [a, icon];
};
