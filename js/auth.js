// Simple password authentication
document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById("login-container");
  const appContainer = document.getElementById("app-container");
  const loginButton = document.getElementById("login-button");
  const passwordInput = document.getElementById("password-input");
  const errorMessage = document.getElementById("error-message");

  // Hard-coded password (you should consider a more secure approach for production)
  const correctPassword = "meatsmoothie"; // Change this to your desired password

  // Check if user is already authenticated
  if (localStorage.getItem("authenticated") === "true") {
    showApp();
  }

  // Login button click handler
  loginButton.addEventListener("click", attemptLogin);

  // Allow Enter key to submit password
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      attemptLogin();
    }
  });

  function attemptLogin() {
    const password = passwordInput.value.trim();

    if (password === correctPassword) {
      // Set authentication in localStorage (this is NOT secure for real applications)
      localStorage.setItem("authenticated", "true");
      showApp();
    } else {
      errorMessage.classList.remove("hidden");
      passwordInput.value = "";
      passwordInput.focus();
    }
  }

  function showApp() {
    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
  }
});
