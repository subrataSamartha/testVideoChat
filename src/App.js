import "./App.css";
import "./styles/main.css";
import "./styles/room.css";
import AgoraRTC from "agora-rtc-sdk-ng";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";

function App() {
  const [toggleCameraClass, setToggleCameraClass] = useState(true);
  const [toggleMicClass, setToggleMicClass] = useState(true);
  const [toggleScreenClass, setToggleScreenClass] = useState(false);

  /* --------------------------------------- agora rtc setup ------------------------------------- */

  const APP_ID = "c58def5b2816419bab70004854531f42";
  let uid = uuidv4();

  let token = null;
  let client;

  let roomId = "main";

  let localTracks = [];
  let remoteUsers = {};

  let localScreenTracks;
  let sharingScreen = false;

  let joinRoomInit = async () => {
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await client.join(APP_ID, roomId, token, uid);

    client.on("user-published", handleUserPublished);
    console.log("after user-published");
    client.on("user-left", handleUserLeft);

    joinStream();
  };

  let joinStream = async () => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
      {},
      {
        encoderConfig: {
          width: { min: 640, ideal: 1920, max: 1920 },
          height: { min: 480, ideal: 1080, max: 1080 },
        },
      }
    );
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                  </div>`;
    document
      .getElementById("streams__container")
      .insertAdjacentHTML("beforeend", player);

    document
      .getElementById(`user-container-${uid}`)
      .addEventListener("click", expandVideoFrame);

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[0], localTracks[1]]);
  };

  let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user;

    await client.subscribe(user, mediaType);

    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {
      player = `<div class="video__container" id="user-container-${user.uid}">
                  <div class="video-player" id="user-${user.uid}"></div>
                </div>`;

      document
        .getElementById("streams__container")
        .insertAdjacentHTML("beforeend", player);
      document
        .getElementById(`user-container-${user.uid}`)
        .addEventListener("click", expandVideoFrame);
    }

    if (displayFrame && displayFrame.style && displayFrame.style.display) {
      player.style.height = "100px";
      player.style.width = "100px";
    }

    if (mediaType === "video") {
      user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  };

  let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();

    if (userIdInDisplayFrame === `user-container-${user.uid}`) {
      displayFrame.style.display = null;

      let videoFrames = document.getElementsByClassName("video__container");

      for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = "300px";
        videoFrames[i].style.width = "300px";
      }
    }
  };

  useEffect(() => {
    joinRoomInit();
  }, []);

  /* --------------------------------------- room features ------------------------------------- */

  let displayFrame;
  let videoFrames;
  let userIdInDisplayFrame = null;

  let expandVideoFrame = (e) => {
    displayFrame = document.getElementById("stream__box");
    let child = displayFrame.children[0];

    if (child) {
      document.getElementById("streams__container").appendChild(child);
    }

    displayFrame.style.display = "block";

    displayFrame.appendChild(e.currentTarget);

    userIdInDisplayFrame = e.currentTarget.id;

    videoFrames = document.getElementsByClassName("video__container");
    // console.log(videoFrames);
    for (let i = 0; i < videoFrames.length; i++) {
      if (videoFrames[i].id !== userIdInDisplayFrame) {
        videoFrames[i].style.height = "100px";
        videoFrames[i].style.width = "100px";
      }
    }
  };

  function addEventListenerToDiv() {
    videoFrames = document.getElementsByClassName("video__container");
    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].addEventListener("click", expandVideoFrame);
    }
  }

  let hideDisplayFrame = () => {
    userIdInDisplayFrame = null;
    displayFrame.style.display = null;

    let child = displayFrame.children[0];

    document.getElementById("streams__container").appendChild(child);

    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = "300px";
      videoFrames[i].style.width = "300px";
    }
  };

  let toggleCamera = async (e) => {
    if (localTracks[1].muted) {
      await localTracks[1].setMuted(false);
      setToggleCameraClass(true);
    } else {
      await localTracks[1].setMuted(true);
      setToggleCameraClass(false);
    }
  };

  let toggleMic = async (e) => {
    if (localTracks[0].muted) {
      await localTracks[0].setMuted(false);
      setToggleMicClass(true);
    } else {
      await localTracks[0].setMuted(true);
      setToggleMicClass(false);
    }
  };

  let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                  </div>`;

    displayFrame = document.getElementById("stream__box"); //get

    displayFrame.insertAdjacentHTML("beforeend", player);

    await localTracks[0].setMuted(true);
    await localTracks[1].setMuted(true);

    setToggleMicClass(false);
    setToggleScreenClass(false);

    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[1]]);
  };

  let toggleScreen = async (e) => {
    let cameraButton = document.getElementById("camera-btn");
    if (!sharingScreen) {
      sharingScreen = true;
      setToggleScreenClass(true);
      setToggleCameraClass(false);
      cameraButton.style.display = "none";

      localScreenTracks = await AgoraRTC.createScreenVideoTrack();

      console.log(
        "ckk before remove ",
        document.getElementById(`user-container-${uid}`)
      );
      document.getElementById(`user-container-${uid}`).remove();
      console.log(
        "ckk after remove ",
        document.getElementById(`user-container-${uid}`)
      );

      displayFrame = document.getElementById("stream__box"); //changes

      displayFrame.style.display = "block";
      let player = `<div class="video__container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div>
                </div>`;
      displayFrame.insertAdjacentHTML("beforeend", player);
      document
        .getElementById(`user-container-${uid}`)
        .addEventListener("click", expandVideoFrame);

      userIdInDisplayFrame = `user-container-${uid}`;
      localScreenTracks.play(`user-${uid}`);

      await client.unpublish([localTracks[1]]);
      await client.publish([localScreenTracks]);

      let videoFrames = document.getElementsByClassName("video__container");
      console.log("samartha", videoFrames);
      for (let i = 0; i < videoFrames.length; i++) {
        if (videoFrames[i].id !== userIdInDisplayFrame) {
          videoFrames[i].style.height = "100px";
          videoFrames[i].style.width = "100px";
        }
      }
    } else {
      sharingScreen = false;
      cameraButton.style.display = "block";
      document.getElementById(`user-container-${uid}`).remove();
      await client.unpublish([localScreenTracks]);

      switchToCamera();
    }
  };

  useEffect(() => {
    addEventListenerToDiv();
  }, []);

  useEffect(() => {
    document
      .getElementById("stream__box")
      .addEventListener("click", hideDisplayFrame);
  }, []);

  useEffect(() => {
    document
      .getElementById("camera-btn")
      .addEventListener("click", toggleCamera);
    document.getElementById("mic-btn").addEventListener("click", toggleMic);
    document
      .getElementById("screen-btn")
      .addEventListener("click", toggleScreen);
  }, []);

  return (
    <>
      <header id="nav">
        <div class="nav--list">
          <button id="members__button">
            {/* <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M24 18v1h-24v-1h24zm0-6v1h-24v-1h24zm0-6v1h-24v-1h24z" fill="#ede0e0"><path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z"/></svg> */}
          </button>
          <a href="lobby.html">
            <h3 id="logo">
              <img src="./images/logo.png" alt="Site Logo" />
              <span>Mumble</span>
            </h3>
          </a>
        </div>

        <div id="nav__links">
          <button id="chat__button">
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fill-rule="evenodd"
              fill="#ede0e0"
              clip-rule="evenodd">
              <path d="M24 20h-3v4l-5.333-4h-7.667v-4h2v2h6.333l2.667 2v-2h3v-8.001h-2v-2h4v12.001zm-15.667-6l-5.333 4v-4h-3v-14.001l18 .001v14h-9.667zm-6.333-2h3v2l2.667-2h8.333v-10l-14-.001v10.001z" />
            </svg>
          </button>
          {/* <!-- <a class="nav__link" href="/">
                Lobby
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ede0e0" viewBox="0 0 24 24"><path d="M20 7.093v-5.093h-3v2.093l3 3zm4 5.907l-12-12-12 12h3v10h7v-5h4v5h7v-10h3zm-5 8h-3v-5h-8v5h-3v-10.26l7-6.912 7 6.99v10.182z"/></svg>
            </a> --> */}
          <a class="nav__link" id="create__room__btn" href="lobby.html">
            Create Room
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#ede0e0"
              viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z" />
            </svg>
          </a>
        </div>
      </header>

      <main class="container">
        <div id="room__container">
          <section id="members__container">
            <div id="members__header">
              <p>Participants</p>
              <strong id="members__count">27</strong>
            </div>

            <div id="member__list">
              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Shahriar P. Shuvo 👋:</p>
              </div>

              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Shahriar P. Shuvo 👋:</p>
              </div>

              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Shahriar P. Shuvo 👋:</p>
              </div>

              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>
              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Shahriar P. Shuvo 👋:</p>
              </div>

              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Shahriar P. Shuvo 👋:</p>
              </div>

              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Shahriar P. Shuvo 👋:</p>
              </div>

              <div class="member__wrapper" id="member__1__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Sulammita</p>
              </div>

              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>
              <div class="member__wrapper" id="member__2__wrapper">
                <span class="green__icon"></span>
                <p class="member_name">Dennis Ivy</p>
              </div>
            </div>
          </section>
          <section id="stream__container">
            <div id="stream__box"></div>

            <div id="streams__container"></div>
            <div class="stream__actions">
              <button
                id="camera-btn"
                className={toggleCameraClass ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24">
                  <path d="M5 4h-3v-1h3v1zm10.93 0l.812 1.219c.743 1.115 1.987 1.781 3.328 1.781h1.93v13h-20v-13h3.93c1.341 0 2.585-.666 3.328-1.781l.812-1.219h5.86zm1.07-2h-8l-1.406 2.109c-.371.557-.995.891-1.664.891h-5.93v17h24v-17h-3.93c-.669 0-1.293-.334-1.664-.891l-1.406-2.109zm-11 8c0-.552-.447-1-1-1s-1 .448-1 1 .447 1 1 1 1-.448 1-1zm7 0c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z" />
                </svg>
              </button>
              <button id="mic-btn" className={toggleMicClass ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24">
                  <path d="M12 2c1.103 0 2 .897 2 2v7c0 1.103-.897 2-2 2s-2-.897-2-2v-7c0-1.103.897-2 2-2zm0-2c-2.209 0-4 1.791-4 4v7c0 2.209 1.791 4 4 4s4-1.791 4-4v-7c0-2.209-1.791-4-4-4zm8 9v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z" />
                </svg>
              </button>
              <button
                id="screen-btn"
                className={toggleScreenClass ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24">
                  <path d="M0 1v17h24v-17h-24zm22 15h-20v-13h20v13zm-6.599 4l2.599 3h-12l2.599-3h6.802z" />
                </svg>
              </button>
              <button id="leave-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24">
                  <path d="M16 10v-5l8 7-8 7v-5h-8v-4h8zm-16-8v20h14v-2h-12v-16h12v-2h-14z" />
                </svg>
              </button>
            </div>
          </section>

          <section id="messages__container">
            <div id="messages">
              <div class="message__wrapper">
                <div class="message__body__bot">
                  <strong class="message__author__bot">🤖 Mumble Bot</strong>
                  <p class="message__text__bot">
                    Welcome to the room, Don't be shy, say hello!
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body__bot">
                  <strong class="message__author__bot">🤖 Mumble Bot</strong>
                  <p class="message__text__bot">
                    Dennis Ivy just entered the room!
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Dennis Ivy</strong>
                  <p class="message__text">
                    Does anyone know hen he will be back?
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body__bot">
                  <strong class="message__author__bot">🤖 Mumble Bot</strong>
                  <p class="message__text__bot">
                    Sulamita just entered the room!
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body__bot">
                  <strong class="message__author__bot">🤖 Mumble Bot</strong>
                  <p class="message__text__bot">
                    Shahriar P. Shuvo just entered the room!
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Sulamita</strong>
                  <p class="message__text"> Great stream!</p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Dennis Ivy</strong>
                  <p class="message__text">
                    {" "}
                    Convert RGB color codes to HEX HTML format for use in web
                    design and CSS.
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Shahriar P. Shuvo 👋</strong>
                  <p class="message__text">
                    Does anyone know hen he will be back?
                  </p>
                </div>
              </div>
              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Sulamita</strong>
                  <p class="message__text">Great stream!</p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Dennis Ivy</strong>
                  <p class="message__text">
                    Convert RGB color codes to HEX HTML format for use in web
                    design and CSS.
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Shahriar P. Shuvo 👋</strong>
                  <p class="message__text">
                    Does anyone know hen he will be back?
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Sulamita</strong>
                  <p class="message__text">Great stream!</p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body__bot">
                  <strong class="message__author__bot">🤖 Mumble Bot</strong>
                  <p class="message__text__bot">
                    👋 Sulamita has left the room
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Dennis Ivy</strong>
                  <p class="message__text">
                    Convert RGB color codes to HEX HTML format for use in web
                    design and CSS.
                  </p>
                </div>
              </div>

              <div class="message__wrapper">
                <div class="message__body">
                  <strong class="message__author">Shahriar P. Shuvo 👋</strong>
                  <p class="message__text">
                    Does anyone know hen he will be back?
                  </p>
                </div>
              </div>
            </div>

            <form id="message__form">
              <input
                type="text"
                name="message"
                placeholder="Send a message...."
              />
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

export default App;
