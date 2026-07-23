const reservationForm = document.querySelector("#reservation-form");
const formMessage = document.querySelector("#form-message");
const reservationList = document.querySelector("#reservation-list");

if (reservationForm) {
  reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    setFormMessage("Saving reservation request...");

    const formData = new FormData(reservationForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/reservations", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        showErrors(result.errors || {});
        setFormMessage(result.message || "Please fix the form and try again.");
        return;
      }

      prependReservation(result.reservation);
      reservationForm.reset();
      setFormMessage("Reservation request saved.");
    } catch (error) {
      setFormMessage("The reservation could not be saved. Please try again.");
    }
  });
}

function clearErrors() {
  document.querySelectorAll("[data-error-for]").forEach((errorNode) => {
    errorNode.textContent = "";
  });
}

function showErrors(errors) {
  Object.entries(errors).forEach(([fieldName, message]) => {
    const errorNode = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorNode) {
      errorNode.textContent = message;
    }
  });
}

function setFormMessage(message) {
  if (formMessage) {
    formMessage.textContent = message;
  }
}

function prependReservation(reservation) {
  if (!reservationList) {
    return;
  }

  const emptyState = reservationList.querySelector(".empty-state");
  if (emptyState) {
    emptyState.remove();
  }

  reservationList.prepend(createReservationItem(reservation));
}

function createReservationItem(reservation) {
  const item = document.createElement("li");
  item.className = "reservation-item";
  item.dataset.reservationId = reservation.id;

  const heading = document.createElement("div");
  const playerName = document.createElement("strong");
  const courtName = document.createElement("span");

  playerName.textContent = reservation.playerName;
  courtName.textContent = reservation.courtName;

  heading.append(playerName, courtName);

  const details = document.createElement("dl");
  [
    ["Date", reservation.reservationDate],
    ["Time", reservation.reservationTime],
    ["Party", reservation.partySize],
    ["Skill", reservation.skillLevel],
  ].forEach(([label, value]) => {
    const group = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value;
    group.append(term, description);
    details.append(group);
  });

  item.append(heading, details);

  return item;
}
