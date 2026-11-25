const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value;

  if (usuario === "" || contrasena === "") {
    loginMessage.textContent = "Por favor, completa todos los campos.";
    return;
  }

  if ((usuario === "admin" || usuario === "admin@futbolfem.com") && contrasena === "futbol123") {
    sessionStorage.setItem("futbolFemSesion", "activa");
    window.location.href = "pages/inicio.html";
  } else {
    loginMessage.textContent = "Usuario o contraseña incorrectos. Inténtalo nuevamente.";
  }
});
