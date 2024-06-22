console.log("JAVA SCRIPT");
let curr_song = new Audio();
let prev_song = null; // To keep track of the previous song element
let songs;
let currfolder;

async function getsongs(folder) {
    currfolder = folder;
    try {
        let a = await fetch(`/${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        // Getting the list of songs
        let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
        songul.innerHTML = "";
        for (const song of songs) {
            songul.innerHTML += `<li>
                <img class="invert" src="svg/music.svg" alt="">
                <div class="info">
                    <div> ${song.replaceAll("%20", " ").replace(".mp3", "")}</div>
                    <div>Artist</div>
                </div>
                <div class="playnow">
                    <div>Play Now</div>
                    <img class="invert" src="svg/play.svg" alt="">
                </div>
            </li>`;
        }

        // Attach an event listener to each song
        Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
            e.addEventListener('click', element => {
                let track = e.querySelector(".info").firstElementChild.innerHTML.trim();
                console.log(track);
                playMusic(track, e);
            });
        });

        return songs; // Return the array of songs
    } catch (error) {
        console.error("Error fetching songs:", error);
        return []; // Return an empty array in case of error
    }
}

const playMusic = (track, element) => {
    curr_song.src = `/${currfolder}/` + track + ".mp3";
    curr_song.play();
    document.querySelector("#play").src = "svg/pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";

    // Reset previous song's icon and text
    if (prev_song) {
        prev_song.querySelector(".playnow img").src = "svg/play.svg";
        prev_song.querySelector(".playnow div").innerHTML = "Play Now";
    }

    // Update the current song's icon and text
    element.querySelector(".playnow img").src = "svg/pause.svg";
    element.querySelector(".playnow div").innerHTML = "Playing";

    // Update the previous song element to the current one
    prev_song = element;
}

function formatTime(seconds) {
    // Ensure seconds is an integer
    seconds = Math.floor(seconds);

    // Calculate the minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Pad the minutes and seconds with leading zero if necessary
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const paddedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    // Combine minutes and seconds into the desired format
    return paddedMinutes + ':' + paddedSeconds;
}

async function displayAlbums() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    console.log("anchors", anchors);
    for (let index = 0; index < Array.from(anchors).length; index++) {
        const e = Array.from(anchors)[index];

        if (e.href.includes("/songs")) {
            let folder = e.href.split('/').slice(-2)[0];
            //metadata
            let a = await fetch(`/songs/${folder}/info.json`);
            let response = await a.json();
            console.log("respose", response);
            cardContainer.innerHTML += `<div data-folder="${folder}" class="card border pointer">
                <svg class="play pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
                    <circle cx="12" cy="12" r="12" fill="#1ed760" />
                    <polygon points="9,7 17,12 9,17" fill="black" />
                </svg>
                <img src="/songs/${folder}/poster.jpeg" alt="">
                <h2>${response.title}</h2>
                <p>${response.description}</p>
            </div>`;
        }
    }

    //load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);

            // Automatically play the first song after fetching the songs
            if (songs.length > 0) {
                playMusic(songs[0].replace(".mp3", ""), document.querySelectorAll(".songlist li")[0]);
            }
        });
    });
}

async function main() {
    //display all the albums on the page
    displayAlbums();

    // Play/Pause button functionality
    play.addEventListener("click", () => {
        if (curr_song.paused) {
            curr_song.play();
            play.src = "svg/pause.svg";
        } else {
            curr_song.pause();
            play.src = "svg/play.svg";
        }
    });

    // Listen for time update event
    curr_song.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(curr_song.currentTime)}/${formatTime(curr_song.duration)}`;
        document.querySelector(".circle").style.left = (curr_song.currentTime / curr_song.duration) * 100 + "%";
    });

    // Listen for song end event to play the next song
    curr_song.addEventListener("ended", () => {
        let index = songs.indexOf(curr_song.src.split("/").slice(-1)[0]);
        if (index >= songs.length - 1) {
            playMusic(songs[0].replace(".mp3", ""), document.querySelectorAll(".songlist li")[0]);
        } else {
            playMusic(songs[index + 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[index + 1]);
        }
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        document.querySelector(".circle").style.left = (e.offsetX / e.target.getBoundingClientRect().width) * 100 + "%";
        curr_song.currentTime = (e.offsetX / e.target.getBoundingClientRect().width) * curr_song.duration;
    });

    // Play/Pause button functionality from keyboard
    document.addEventListener("keydown", e => {
        console.log(e);
        if (e.code === "MediaPlayPause") { // Media Play/Pause key
            e.preventDefault(); // Prevent default action

            if (curr_song.paused) {
                curr_song.play();
                play.src = "svg/pause.svg"; // Change play button to pause icon
            } else {
                curr_song.pause();
                play.src = "svg/play.svg"; // Change pause button to play icon
            }
        }
    });

    document.addEventListener("keydown", e => {
        if (e.code === "MediaTrackNext") {
            console.log(e);
            console.log("next clicked");
            let index = songs.indexOf(curr_song.src.split("/").slice(-1)[0]);
            console.log(index);
            if (index >= songs.length - 1) {
                playMusic(songs[0].replace(".mp3", ""), document.querySelectorAll(".songlist li")[0]);
            } else {
                playMusic(songs[index + 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[index + 1]);
            }
        }
    });

    document.addEventListener("keydown", e => {
        if (e.code === "MediaTrackPrevious") {
            console.log(e);
            console.log("Previous clicked");
            let index = songs.indexOf(curr_song.src.split("/").slice(-1)[0]);
            console.log(index);
            if (index == 0) {
                playMusic(songs[songs.length - 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[songs.length - 1]);
            } else {
                playMusic(songs[index - 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[index - 1]);
            }
        }
    });

    // Event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    });

    // Event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = -100 + "%";
    });

    // Event listener for prev and next buttons
    previous.addEventListener("click", () => {
        console.log("Previous clicked");
        let index = songs.indexOf(curr_song.src.split("/").slice(-1)[0]);
        console.log(index);
        if (index == 0) {
            playMusic(songs[songs.length - 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[songs.length - 1]);
        } else {
            playMusic(songs[index - 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        console.log("next clicked");
        let index = songs.indexOf(curr_song.src.split("/").slice(-1)[0]);
        console.log(index);
        if (index >= songs.length - 1) {
            playMusic(songs[0].replace(".mp3", ""), document.querySelectorAll(".songlist li")[0]);
        } else {
            playMusic(songs[index + 1].replace(".mp3", ""), document.querySelectorAll(".songlist li")[index + 1]);
        }
    });

    document.getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log(e);
        curr_song.volume = parseFloat(e.target.value / 100);

        const volumeIcon = document.querySelector(".volume img");

        if (curr_song.volume === 0) {
            volumeIcon.src = "svg/mute.svg";
        } else if (curr_song.volume < 0.5) {
            volumeIcon.src = "svg/volume-down.svg";
        } else {
            volumeIcon.src = "svg/volume.svg";
        }
    });
}

main();
