const body = document.querySelector('body'),
    sidebar = body.querySelector('nav'),
    toggle = body.querySelector(".toggle"),
    searchBtn = body.querySelector(".search-box"),
    modeSwitch = body.querySelector(".toggle-switch"),
    modeText = body.querySelector(".mode-text");

/* Para abrir y cerrar la barra lateral */
toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
})

/* Para abrir y cerrar la busqueda */
searchBtn.addEventListener("click", () => {
    sidebar.classList.remove("close");
})

/* Para cambiar al darkmode y luego al lighmode  */
modeSwitch.addEventListener("click", () => {
    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
        modeText.innerText = "Light mode";
    } else {
        modeText.innerText = "Dark mode";

    }
});