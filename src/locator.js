import cameraImage from "./camera.svg";
import playImage from "./play-btn.svg";
import pauseImage from "./pause-btn.svg";
import saveImage from "./save.svg";
import cancelImage from "./x-circle.svg";
import locationIcon from "./icons/location.png";

const COORD_FORMATTER = Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
  minimumIntegerDigits: 3,
  style: "unit",
  unit: "degree",
});
const DIST_FORMATTER = Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: "unit",
  unit: "meter",
});
const DEG_FORMATTER = Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: "unit",
  unit: "degree",
});

const LOCATION_ID = "location";
const CAMERA_INPUT_ID = "camera";
const PLAY_INPUT_ID = "play";
const PAUSE_INPUT_ID = "pause";
const SAVE_INPUT_ID = "save";
const CANCEL_INPUT_ID = "cancel";
const MAP_ID = "map";
const FOOTER_ID = "footer";
const VIDEO_ID = "video";
const CANVAS_ID = "canvas";
const PHOTO_ID = "photo";

// location updates using the Geolocation API
var geolocation;
if ("geolocation" in navigator) {
  geolocation = navigator.geolocation;
}

const watchID = navigator.geolocation.watchPosition(locate, handleErr);

function locate(position) {
  //the time at which the location was retrieved
  //   console.debug(position.timestamp);

  //the geographic position in degrees
  const c = position.coords;
  //   console.debug(`my position: lat=${c.latitude} lng=${c.longitude}`);

  updatePosition({
    coords: {
      latitude: c.latitude,
      longitude: c.longitude,
      altitude: c.altitude,
      accuracy: c.accuracy,
      heading: c.heading,
      speed: c.speed,
    },
  });
}

function handleErr(err) {
  console.error(err.message);
}

document.addEventListener("beforeunload", (event) => {
  if (geolocation) {
    geolocation.clearWatch(watchID);
  }
});

//map state
var map;
var ranger;
var locationMarker;

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function configureMap(latLngArray) {
  map = L.map("map").setView(latLngArray, 17);
  if (isTouchDevice()) {
    map.removeControl(map.zoomControl);
  }
  map.attributionControl.setPosition("bottomright");

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  ranger = L.circle(latLngArray, { radius: 20.0 }).addTo(map);
}

function updatePosition(position) {
  const locatorDiv = document.getElementById(LOCATION_ID);

  const coords = position.coords;
  //   console.debug("got new coordinates:", coords);
  locatorDiv.innerHTML = `
    <dl>
        <dt>LAT</dt>
        <dd>${COORD_FORMATTER.format(coords.latitude)}</dd>
        <dt>LONG</dt>
        <dd>${COORD_FORMATTER.format(coords.longitude)}</dd>
        <dt>ALT</dt>
        <dd>${
          coords.altitude ? DIST_FORMATTER.format(coords.altitude) : "-"
        }</dd>
        <dt>ACC</dt>
        <dd>${DIST_FORMATTER.format(coords.accuracy)}</dd>
        <dt>HEAD</dt>
        <dd>${coords.heading ? DEG_FORMATTER.format(coords.heading) : "-"}</dd>
        <dt>SPED</dt>
        <dd>${coords.speed ? DIST_FORMATTER.format(coords.speed) : "-"}</dd>
    </dl>
  `;
  var ll = [coords.latitude, coords.longitude];

  map.setView(ll);

  ranger.setLatLng(ll);
  ranger.setRadius(coords.accuracy);

  if (!locationMarker) {
    // add marker for representing the current position
    const icon = L.icon({
      iconUrl: locationIcon,
      iconSize: [24, 24], // Size of the icon in pixels
      iconAnchor: [12, 16], // The point of the icon that corresponds to the marker's location
    });
    locationMarker = L.marker(ll, { icon: icon }).addTo(map);
    locationMarker.bindPopup("You are here!");
    // console.debug("initialising locationMarker", ll);
  } else {
    locationMarker.setLatLng(ll);
    // console.debug("updating position", ll);
  }
}

var streaming = false;

function adjustAspectRatios(event) {
  let width = 320;
  let height = 0;
  const video = document.getElementById(VIDEO_ID);
  const canvas = document.getElementById(CANVAS_ID);

  //perform a one-time adjustment of video's and photo's aspect ratio
  if (!streaming) {
    height = (video.videoHeight / video.videoWidth) * width;
    if (isNaN(height)) {
      height = (width * 3.0) / 4.0;
    }
    video.setAttribute("width", width);
    video.setAttribute("height", height);
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    streaming = true;
  }
}

function pauseVideoAndTakePicture(event) {
  const video = document.getElementById(VIDEO_ID);
  const photo = document.getElementById(PHOTO_ID);
  const canvas = document.getElementById(CANVAS_ID);
  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  const playButton = document.getElementById(PLAY_INPUT_ID);

  video.pause();

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, video.width, video.height);
  imageData = canvas.toDataURL("image/jpeg");
  photo.setAttribute("src", imageData);

  pauseButton.style.display = "none";
  playButton.style.display = "inline";
}

function playVideo(event) {
  const video = document.getElementById(VIDEO_ID);
  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  const playButton = document.getElementById(PLAY_INPUT_ID);

  video.play();
  pauseButton.style.display = "inline";
  playButton.style.display = "none";
}

function loadCameraPage(event) {
  document.getElementById(MAP_ID).style.display = "none";
  document.getElementById(FOOTER_ID).style.display = "none";

  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  pauseButton.src = pauseImage;
  pauseButton.style.display = "inline";
  pauseButton.onclick = pauseVideoAndTakePicture;

  const playButton = document.getElementById(PLAY_INPUT_ID);
  playButton.src = playImage;
  playButton.style.display = "none";
  playButton.onclick = playVideo;

  const saveButton = document.getElementById(SAVE_INPUT_ID);
  saveButton.src = saveImage;
  saveButton.style.display = "inline";
  saveButton.onclick = () => {
    console.debug("save clicked");
  };

  const cancelButton = document.getElementById(CANCEL_INPUT_ID);
  cancelButton.src = cancelImage;
  cancelButton.style.display = "inline";
  cancelButton.onclick = loadStartPage

  const video = document.getElementById(VIDEO_ID);
  video.style.display = "block";
  video.addEventListener("canplay", adjustAspectRatios);

  //start video playback
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      console.error(`An error occurred: ${err}`);
    });
}

function loadStartPage() {
    document.getElementById(MAP_ID).style.display = "block";
    document.getElementById(FOOTER_ID).style.display = "flex";

    document.getElementById(VIDEO_ID).style.display = "none";
    document.getElementById(PLAY_INPUT_ID).style.display = "none";
    document.getElementById(PAUSE_INPUT_ID).style.display = "none";
    document.getElementById(SAVE_INPUT_ID).style.display = "none";
    document.getElementById(CANCEL_INPUT_ID).style.display = "none";

}

/* setup component */
window.onload = () => {
  document.getElementById(VIDEO_ID).style.display = "none";
  document.getElementById(CANVAS_ID).style.display = "none";
  document.getElementById(PHOTO_ID).style.display = "none";

  const cameraButton = document.getElementById(CAMERA_INPUT_ID);
  cameraButton.src = cameraImage;
  cameraButton.onclick = loadCameraPage

  //init leaflet
  configureMap([47.406653, 9.744844]);

  //init footer
  // updatePosition({ coords: { latitude: 47.406653, longitude: 9.744844, altitude: 440, accuracy: 40, heading: 45, speed: 1.8 } });

  // setup service worker
  //   if ('serviceWorker' in navigator) {
  //       navigator.serviceWorker.register(
  //           new URL('serviceworker.js', import.meta.url),
  //           { type: 'module' }
  //       ).then(() => {
  //           console.log('Service worker registered!');
  //       }).catch((error) => {
  //           console.warn('Error registering service worker:');
  //           console.warn(error);
  //       });
  //   }
};
