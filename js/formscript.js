const formOpenBtn = document.querySelector("#form-login"),
    home = document.querySelector(".home"),
    formContainer = document.querySelector(".form_container"),
    formCloseBtn = document.querySelector(".form_close"),
    signupBtn = document.querySelector("#signup"),
    loginBtn = document.querySelector("#login"),
    pwShowHide = document.querySelectorAll(".pw_hide");        

formOpenBtn.addEventListener("click", () => {
    home.classList.add("show");
    /* --- Este hiddenText es una const que viene del dropzone del script.js --- */
    hiddenText.style.visibility = 'hidden';
    dropZone.style.visibility = 'visible';
});

formCloseBtn.addEventListener("click", () => {
    home.classList.remove("show");    
    dropZone.style.visibility = 'hidden';    
});

pwShowHide.forEach((icon) => {
    icon.addEventListener("click", () => {
        let getPwInput = icon.parentElement.querySelector("input");
        if (getPwInput.type === "password") {
            getPwInput.type = "text";                        
        } else {
            getPwInput.type = "password";                            
        }        

        if(icon.innerHTML == "visibility"){
            icon.innerHTML = "visibility_off";
        }else{
            icon.innerHTML = "visibility";
        }
    });
});

signupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    formContainer.classList.add("active");
});
loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    formContainer.classList.remove("active");
});
