import {
  COUNTRIES,
  GENDERS,
  usernameError,
  validateProfile,
} from "./profile.js";
import { CREATION_ARTWORK, imageIcon, flagImage } from "./art.js";
export function mountProfile(root, onContinue) {
  root.innerHTML = `<section class="creation-screen" aria-labelledby="creation-title">
  <div class="creation-character"><img id="creation-layla" src="${CREATION_ARTWORK}" alt="Layla with long golden twin tails and her cannon" draggable="false"><div class="character-credit"><span>YOUR JOURNEY STARTS HERE</span><b>MOBA LAB</b></div></div>
  <form id="profile-form" class="profile-form" novalidate><p class="menu-kicker">WELCOME, CHALLENGER</p><h1 id="creation-title">CREATE USERNAME</h1><p class="menu-subtitle">Every story begins with a name.</p>
   <label class="field-label" for="profile-username">Username <span>4–20 characters</span></label>
   <input id="profile-username" name="username" type="text" placeholder="Enter your username" maxlength="20" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" aria-describedby="username-feedback" required>
   <p id="username-feedback" class="validation-message" aria-live="polite">Letters, numbers and underscores. No spaces.</p>
   <div class="profile-choices"><div><span class="field-label">Country</span><details id="country-picker"><summary aria-label="Choose country"><span id="current-country">${flagImage("PH")}<span>Philippines</span></span><span aria-hidden="true">⌄</span></summary><div class="country-options" role="radiogroup" aria-label="Country">${Object.entries(
     COUNTRIES,
   )
     .map(
       ([code, label]) =>
         `<button type="button" class="flag-choice" role="radio" aria-checked="${code === "PH"}" data-country="${code}">${flagImage(code)}<span>${label}</span></button>`,
     )
     .join("")}</div></details></div>
   <fieldset class="gender-picker"><legend class="field-label">Gender</legend><div role="radiogroup" aria-label="Gender">${GENDERS.map((name) => `<button type="button" role="radio" aria-checked="false" data-gender="${name}">${imageIcon(name.toLowerCase())}<span>${name}</span></button>`).join("")}</div></fieldset></div>
   <p id="profile-feedback" class="profile-feedback" aria-live="polite">Choose a gender to complete your local profile.</p>
   <button class="gold-button" id="profile-continue" type="submit" disabled>Continue <span aria-hidden="true">→</span></button>
   <p class="privacy-note">LOCAL PROFILE · NO ONLINE ACCOUNT<br>Your profile stays in this browser when storage is available.</p>
  </form></section>`;
  const input = root.querySelector("#profile-username"),
    submit = root.querySelector("#profile-continue");
  let country = "PH",
    gender = null;
  function update() {
    const error = usernameError(input.value),
      ready = validateProfile({ username: input.value, country, gender });
    const touched = input.value.length > 0;
    input.setAttribute("aria-invalid", String(touched && Boolean(error)));
    root.querySelector("#username-feedback").textContent = touched
      ? error || "Username ready."
      : "Letters, numbers and underscores. No spaces.";
    root.querySelector("#profile-feedback").textContent = !gender
      ? "Choose a gender to complete your local profile."
      : ready
        ? "Ready to enter the lobby."
        : "Enter a valid username to continue.";
    submit.disabled = !ready;
  }
  input.addEventListener("input", update);
  root.querySelectorAll("[data-country]").forEach((button) =>
    button.addEventListener("click", () => {
      country = button.dataset.country;
      root
        .querySelectorAll("[data-country]")
        .forEach((b) => b.setAttribute("aria-checked", String(b === button)));
      root.querySelector("#current-country").innerHTML =
        `${flagImage(country)}<span>${COUNTRIES[country]}</span>`;
      root.querySelector("#country-picker").open = false;
      update();
    }),
  );
  root.querySelectorAll("[data-gender]").forEach((button) =>
    button.addEventListener("click", () => {
      gender = button.dataset.gender;
      root
        .querySelectorAll("[data-gender]")
        .forEach((b) => b.setAttribute("aria-checked", String(b === button)));
      update();
    }),
  );
  root.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const profile = validateProfile({ username: input.value, country, gender });
    if (!profile) {
      update();
      return;
    }
    onContinue(profile);
  });
}
