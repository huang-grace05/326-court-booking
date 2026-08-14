function createReservationItem(reservation) {
  const item = document.createElement("li");
  item.className =
    "reservation-item rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:shadow-sm";
  item.dataset.reservationId = reservation.id;

  const heading = document.createElement("div");
  heading.className = "flex flex-col gap-1";

  const playerName = document.createElement("strong");
  playerName.className = "text-lg text-slate-900";
  playerName.textContent = reservation.playerName;

  const courtName = document.createElement("span");
  courtName.className = "font-medium text-emerald-700";
  courtName.textContent = reservation.courtName;

  heading.append(playerName, courtName);

  const details = document.createElement("dl");
  details.className = "mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4";

  [
    ["Date", reservation.reservationDate],
    ["Time", reservation.reservationTime],
    ["Party", reservation.partySize],
    ["Skill", reservation.skillLevel],
  ].forEach(([label, value]) => {
    const group = document.createElement("div");
    group.className = "rounded-lg bg-white p-3";

    const term = document.createElement("dt");
    term.className = "font-semibold text-slate-500";
    term.textContent = label;

    const description = document.createElement("dd");
    description.className = "mt-1 text-slate-900";
    description.textContent = value;

    group.append(term, description);
    details.append(group);
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "mt-4 w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto";
  cancelButton.textContent = "Cancel";
  cancelButton.setAttribute(
    "hx-delete",
    `/reservations/${reservation.id}`,
  );
  cancelButton.setAttribute("hx-target", "closest li");
  cancelButton.setAttribute("hx-swap", "outerHTML");
  cancelButton.setAttribute("hx-confirm", "Cancel this reservation?");

  item.append(heading, details, cancelButton);
  htmx.process(item);

  return item;
}

document.body.addEventListener("htmx:beforeSwap", (event) => {
  if (event.detail.requestConfig.verb !== "delete") return;

  const heading = document.querySelector("#saved-reservations-heading");
  if (!heading) return;

  heading.setAttribute("tabindex", "-1");
  heading.focus();
});
