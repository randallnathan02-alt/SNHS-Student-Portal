
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  message.textContent =
    "Login is not yet connected to an authentication system.";
  message.style.color = "#a15c00";
});
