/* --- Se llaman los botones por su id --- */
const wrapper = document.querySelector(".wrapper"),
    musicImg = wrapper.querySelector(".img-area img"),
    musicName = wrapper.querySelector(".song-details .name"),
    musicArtist = wrapper.querySelector(".song-details .artist"),
    /* Controles  */
    playPauseBtn = wrapper.querySelector(".play-pause"),
    prevBtn = wrapper.querySelector("#prev"),
    nextBtn = wrapper.querySelector("#next"),
    rewBtn = wrapper.querySelector("#rew"),
    forwBtn = wrapper.querySelector("#forw"),
    /* Sonido */
    mainAudio = wrapper.querySelector("#main-audio"),
    soundBtn = wrapper.querySelector("#volume-up"),
    volumeSlider = document.querySelector(".volume-slider"),

    /* Favoritos */
    favBtn = document.querySelector("#fav"),
    /* Barra de progreso */
    progressArea = wrapper.querySelector(".progress-area"),
    progressBar = progressArea.querySelector(".progress-bar"),
    /* Lista de música */
    musicList = wrapper.querySelector(".music-list"),
    moreMusicBtn = wrapper.querySelector("#more-music"),
    closemoreMusic = musicList.querySelector("#close");

let musicIndex = Math.floor((Math.random() * allMusic.length) + 1);
isMusicPaused = true;

window.addEventListener("load", () => {
    loadMusic(musicIndex);
    playingSong();
});

function getFileExtension1(filename) {
    return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename)[0] : undefined;
}

function loadMusic(indexNumb) {
    musicName.innerText = allMusic[indexNumb - 1].name;
    musicArtist.innerText = allMusic[indexNumb - 1].artist;
    //let ext;
    musicImg.src = `upload/${allMusic[indexNumb - 1].img}`;
    mainAudio.src = `upload/${allMusic[indexNumb - 1].src}`;
}

//play music function
function playMusic() {
    wrapper.classList.add("paused");
    playPauseBtn.querySelector("i").innerText = "pause";
    mainAudio.play();
}

//pause music function
function pauseMusic() {
    wrapper.classList.remove("paused");
    playPauseBtn.querySelector("i").innerText = "play_arrow";
    mainAudio.pause();
}

//prev music function
function prevMusic() {
    musicIndex--; //decrement of musicIndex by 1
    //if musicIndex is less than 1 then musicIndex will be the array length so the last music play
    musicIndex < 1 ? musicIndex = allMusic.length : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
    playingSong();
}

//next music function
function nextMusic() {
    musicIndex++; //increment of musicIndex by 1
    //if musicIndex is greater than array length then musicIndex will be 1 so the first music play
    musicIndex > allMusic.length ? musicIndex = 1 : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
    playingSong();
}

function rewind() {
    let currentTime = mainAudio.currentTime;
    currentTime -= 10;
    if (currentTime < 0) {
        currentTime = 0;
    }
    mainAudio.currentTime = currentTime;
}

function forward() {
    let currentTime = mainAudio.currentTime;
    let duration = mainAudio.duration;
    currentTime += 10;
    if (currentTime > duration) currentTime = duration;
    mainAudio.currentTime = currentTime;
}

favBtn.addEventListener("click", () => {
    if (favBtn.innerHTML == "add_circle") {
        favBtn.innerHTML = "favorite";
    } else {
        favBtn.innerHTML = "add_circle";
    }
});

soundBtn.addEventListener("click", () => {
    if (soundBtn.innerHTML == "volume_off") {
        soundBtn.innerHTML = "volume_up";
        mainAudio.volume = 0.5;
        volumeSlider.value = 50;
    } else {
        soundBtn.innerHTML = "volume_off";
        mainAudio.volume = 0;
        volumeSlider.value = 0;
    }
    /* volumeProgressArea.classList.toggle("show"); */
});
/* Esto ahora funciona con CSS
    soundBtn.addEventListener("mouseover", () => {
    volumeSlider.style.display = 'inline';
});
soundBtn.addEventListener("mouseup", () => {
    volumeSlider.style.display = 'none';
}); */
volumeSlider.addEventListener("input", () => {
    mainAudio.volume = volumeSlider.value / 100;
    /* let val = (volumeSlider.value / volumeSlider.ariaValueMax) * 100;
    volumeSlider.style.background = 'linear-gradient(to right, #ff74a4 $(val)%, #5f0a87 $(val)%)';
    volumeSlider.textContent = volumeSlider.value; */
});

rewBtn.addEventListener("click", () => {
    rewind();
});

forwBtn.addEventListener("click", () => {
    forward();
});

// play or pause button event
playPauseBtn.addEventListener("click", () => {
    const isMusicPlay = wrapper.classList.contains("paused");
    //if isPlayMusic is true then call pauseMusic else call playMusic
    isMusicPlay ? pauseMusic() : playMusic();
    playingSong();
});

//prev music button event
prevBtn.addEventListener("click", () => {
    prevMusic();
});

//next music button event
nextBtn.addEventListener("click", () => {
    nextMusic();
});

// update progress bar width according to music current time
mainAudio.addEventListener("timeupdate", (e) => {
    const currentTime = e.target.currentTime; //getting playing song currentTime
    const duration = e.target.duration; //getting playing song total duration
    let progressWidth = (currentTime / duration) * 100;
    progressBar.style.width = `${progressWidth}%`;
    let musicCurrentTime = wrapper.querySelector(".current-time"),
        musicDuration = wrapper.querySelector(".max-duration");
    mainAudio.addEventListener("loadeddata", () => {
        // update song total duration
        let mainAdDuration = mainAudio.duration;
        let totalMin = Math.floor(mainAdDuration / 60);
        let totalSec = Math.floor(mainAdDuration % 60);
        if (totalSec < 10) { //if sec is less than 10 then add 0 before it
            totalSec = `0${totalSec}`;
        }
        musicDuration.innerText = `${totalMin}:${totalSec}`;
    });
    // update playing song current time
    let currentMin = Math.floor(currentTime / 60);
    let currentSec = Math.floor(currentTime % 60);
    if (currentSec < 10) { //if sec is less than 10 then add 0 before it
        currentSec = `0${currentSec}`;
    }
    musicCurrentTime.innerText = `${currentMin}:${currentSec}`;
});

// update playing song currentTime on according to the progress bar width
progressArea.addEventListener("click", (e) => {
    let progressWidth = progressArea.clientWidth; //getting width of progress bar
    let clickedOffsetX = e.offsetX; //getting offset x value
    let songDuration = mainAudio.duration; //getting song total duration
    mainAudio.currentTime = (clickedOffsetX / progressWidth) * songDuration;
    playMusic(); //calling playMusic function
    playingSong();
});

//change loop, shuffle, repeat icon onclick
const repeatBtn = wrapper.querySelector("#repeat-plist");
repeatBtn.addEventListener("click", () => {
    let getText = repeatBtn.innerText; //getting this tag innerText
    switch (getText) {
        case "repeat":
            repeatBtn.innerText = "repeat_one";
            repeatBtn.setAttribute("title", "Song looped");
            break;
        case "repeat_one":
            repeatBtn.innerText = "shuffle";
            repeatBtn.setAttribute("title", "Playback shuffled");
            break;
        case "shuffle":
            repeatBtn.innerText = "repeat";
            repeatBtn.setAttribute("title", "Playlist looped");
            break;
    }
});

//code for what to do after song ended
mainAudio.addEventListener("ended", () => {
    // we'll do according to the icon means if user has set icon to
    // loop song then we'll repeat the current song and will do accordingly
    let getText = repeatBtn.innerText; //getting this tag innerText
    switch (getText) {
        case "repeat":
            nextMusic(); //calling nextMusic function
            break;
        case "repeat_one":
            mainAudio.currentTime = 0; //setting audio current time to 0
            loadMusic(musicIndex); //calling loadMusic function with argument, in the argument there is a index of current song
            playMusic(); //calling playMusic function
            break;
        case "shuffle":
            let randIndex = Math.floor((Math.random() * allMusic.length) + 1); //genereting random index/numb with max range of array length
            do {
                randIndex = Math.floor((Math.random() * allMusic.length) + 1);
            } while (musicIndex == randIndex); //this loop run until the next random number won't be the same of current musicIndex
            musicIndex = randIndex; //passing randomIndex to musicIndex
            loadMusic(musicIndex);
            playMusic();
            playingSong();
            break;
    }
});

//show music list onclick of music icon
moreMusicBtn.addEventListener("click", () => {
    musicList.classList.toggle("show");
});
closemoreMusic.addEventListener("click", () => {
    moreMusicBtn.click();
});

const ulTag = wrapper.querySelector("ul");
// let create li tags according to array length for list
for (let i = 0; i < allMusic.length; i++) {
    let uniqueId = "audio" + i;
    //let's pass the song name, artist from the array
    let liTag = `<li li-index="${i + 1}">
                <div class="row">
                    <span>${allMusic[i].name}</span>
                    <p>${allMusic[i].artist}</p>
                </div>
                <span id="duration${uniqueId}" class="audio-duration">3:40</span>
                <audio id="${uniqueId}" src="music/${allMusic[i].src}"></audio>
                </li>`;
    ulTag.insertAdjacentHTML("beforeend", liTag); //inserting the li inside ul tag
    let liAudioDurationTag = document.getElementById(`duration${uniqueId}`);
    let liAudioTag = document.getElementById(uniqueId);
    if(liAudioDurationTag && liAudioTag) {
        liAudioTag.addEventListener("loadeddata", () => {
            let duration = liAudioTag.duration;
            let totalMin = Math.floor(duration / 60);
            let totalSec = Math.floor(duration % 60);
            if (totalSec < 10) { //if sec is less than 10 then add 0 before it
                totalSec = `0${totalSec}`;
            };
            liAudioDurationTag.innerText = `${totalMin}:${totalSec}`; //passing total duation of song
            liAudioDurationTag.setAttribute("t-duration", `${totalMin}:${totalSec}`); //adding t-duration attribute with total duration value
        });
    } else {
        console.error(`Could not select elements with id duration${uniqueId} or ${uniqueId}`);
    }
}

//play particular song from the list onclick of li tag
function playingSong() {
    const allLiTag = ulTag.querySelectorAll("li");
    for (let j = 0; j < allLiTag.length; j++) {
        let audioTag = allLiTag[j].querySelector(".audio-duration");
        if (allLiTag[j].classList.contains("playing")) {
            allLiTag[j].classList.remove("playing");
            let adDuration = audioTag.getAttribute("t-duration");
            audioTag.innerText = adDuration;
        }
        //if the li tag index is equal to the musicIndex then add playing class in it
        if (allLiTag[j].getAttribute("li-index") == musicIndex) {
            allLiTag[j].classList.add("playing");
            audioTag.innerText = "Playing";
        }
        allLiTag[j].setAttribute("onclick", "clicked(this)");
    }
}

//particular li clicked function
function clicked(element) {
    let getLiIndex = element.getAttribute("li-index");
    musicIndex = getLiIndex; //updating current song index with clicked li index
    loadMusic(musicIndex);
    playMusic();
    playingSong();
}

/* --- Drag and Drop Functions --- */
const dropZone = document.getElementById("dropZone"),
    hiddenText = document.querySelector(".hidden-text");

document.body.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZone.style.visibility = 'visible';
    hiddenText.style.visibility = 'visible';
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragging");
    dropZone.style.visibility = 'hidden';
    hiddenText.style.visibility = 'hidden';
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
    hiddenText.style.visibility = 'hidden';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("audio/")) {
            playDroppedFile(file);

        } else {
            alert("Por favor, arrastra sólo archivos de audio.");
        }
    }
    dropZone.style.visibility = 'hidden';
});

function playDroppedFile(file) {
    const mainAudio = document.getElementById("main-audio");
    const songName = document.querySelector(".name");
    const songArtist = document.querySelector(".artist");

    mainAudio.src = URL.createObjectURL(file);
    songName.textContent = file.name;
    songArtist.textContent = "Desconocido";
    playMusic();
    playingSong();
}

/* --- Funcionalidad para que se abra una sola carta y se cierren las otras --- */
const btnFavorite = document.getElementById("btnFavorite"),
    favorite = document.getElementById("favorites"),
    btnMusicList = document.getElementById("btnMusicList"),
    music_list = document.getElementById("music_list"),
    btnReproductor = document.getElementById("btnReproductor"),
    reproductor = document.getElementById("reproductor"),
    btnProfile = document.getElementById("btnProfile"),
    profile = document.getElementById("profile"),
    btnAddMusic = document.getElementById("btnAddMusic"),
    addMusic = document.getElementById("add_music");


btnReproductor.addEventListener("click", () =>{
    if (reproductor.style.display == 'inline') {
        reproductor.style.display = 'none';
        favorite.style.display = 'none';
        music_list.style.display = 'none';
        addMusic.style.display = 'none';
        profile.style.display = 'none';
    } else {
        reproductor.style.display = 'inline';
        favorite.style.display = 'none';
        music_list.style.display = 'none';
        addMusic.style.display = 'none';
        profile.style.display = 'none';
    }
});

btnFavorite.addEventListener("click", () => {
    if(favorite.style.display == 'inline'){
        favorite.style.display = 'none';        
    }else{
        favorite.style.display = 'inline';
        reproductor.style.display = 'none';
        music_list.style.display = 'none';
        addMusic.style.display = 'none';
        profile.style.display = 'none';
    }        
});

btnMusicList.addEventListener("click", () => {
    if(music_list.style.display == 'inline'){
        music_list.style.display = 'none';
    }else{
        music_list.style.display = 'inline';
        reproductor.style.display = 'none';
        favorite.style.display = 'none';
        addMusic.style.display = 'none';
        profile.style.display = 'none';
    }        
});

btnAddMusic.addEventListener("click", () => {
        if(addMusic.style.display == 'inline'){
            addMusic.style.display = 'none';
        }else{
            music_list.style.display = 'none';
            addMusic.style.display = 'inline';
            reproductor.style.display = 'none';
            favorite.style.display = 'none';
            profile.style.display = 'none';
        }    
});

btnProfile.addEventListener("click", () => {
    if(profile.style.display == 'inline'){
        profile.style.display = 'none';
    }else{
        profile.style.display = 'inline';
        music_list.style.display = 'none';
        reproductor.style.display = 'none';
        addMusic.style.display = 'none';
        favorite.style.display = 'none';
    }        
});


