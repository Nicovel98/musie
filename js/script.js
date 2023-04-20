/* Se llaman los botones por su id */
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

    /* volumeProgressArea = wrapper.querySelector(".volume-progress-area"),
    volumeProgressBar = volumeProgressArea.querySelector(".volume-progress-bar"), */
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
    musicImg.src = `img/${allMusic[indexNumb - 1].img}`;
    mainAudio.src = `music/${allMusic[indexNumb - 1].src}.mp3`;
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

function soundup() {

}

function sounddown() {

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
    //let's pass the song name, artist from the array
    let liTag = `<li li-index="${i + 1}">
                <div class="row">
                    <span>${allMusic[i].name}</span>
                    <p>${allMusic[i].artist}</p>
                </div>
                <span id="${allMusic[i].src}" class="audio-duration">3:40</span>
                <audio class="${allMusic[i].src}" src="music/${allMusic[i].src}.mp3"></audio> 
                </li>`;
    ulTag.insertAdjacentHTML("beforeend", liTag); //inserting the li inside ul tag

    let liAudioDurationTag = ulTag.querySelector(`#${allMusic[i].src}`);
    let liAudioTag = ulTag.querySelector(`.${allMusic[i].src}`);
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

/* Drag and Drop Functions */

document.addEventListener('DOMContentLoaded', (event) => {

    function handleDragStart(e) {
        this.style.opacity = '0.4';
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';

        items.forEach(function(item) {
            item.classList.remove('over');
        });
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragSrcEl !== this) {
            dragSrcEl.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');
        }
        return false;
    }
    /* function handleDrop(e) {
        e.stopPropagation(); // Stops some browsers from redirecting.
        e.preventDefault();
        var files = e.dataTransfer.files;
        for (var i = 0, f; f = files[i]; i++) {
            // Read the File objects in this FileList.
        }
    } */

    let items = document.querySelectorAll('.container .box');
    items.forEach(function(item) {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('drop', handleDrop);
    });
});

function getMetadataForFileList(fileList) {
    for (const file of fileList) {
        // Not supported in Safari for iOS.
        const name = file.name ? file.name : 'NOT SUPPORTED';
        // Not supported in Firefox for Android or Opera for Android.
        const type = file.type ? file.type : 'NOT SUPPORTED';
        // Unknown cross-browser support.
        const size = file.size ? file.size : 'NOT SUPPORTED';
        console.log({ file, name, type, size });
    }
}



/* const dropArea = document.getElementById("dropArea");

// Agrega event listeners para los eventos de drag-and-drop
dropArea.addEventListener("dragenter", preventDefaults, false);
dropArea.addEventListener("dragover", preventDefaults, false);
dropArea.addEventListener("dragleave", preventDefaults, false);
dropArea.addEventListener("drop", handleDrop, false);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    // Obtén el archivo arrastrado y su información
    let droppedFile = e.dataTransfer.files[0];
    let droppedFileName = droppedFile.name;
    let droppedFileType = droppedFile.type;

    // Verifica si el archivo es de tipo MP3
    if (droppedFileType === "audio/mp3" || droppedFileType === "audio/mpeg") {
        // Aquí puedes procesar el archivo de audio, por ejemplo, agregarlo a tu lista de reproducción
        console.log("Nombre del archivo de audio:", droppedFileName);
    } else {
        alert("Por favor, arrastra un archivo MP3.");
    }
} */