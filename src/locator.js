import cameraImage from "./camera.svg";
import playImage from "./play-btn.svg";
import pauseImage from "./pause-btn.svg";
import saveImage from "./save.svg";
import cancelImage from "./x-circle.svg";
import locationIcon from "./icons/location.png";
import ArrowUpCircle from "./arrow-up-circle.svg";

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

var geolocation;
if ("geolocation" in navigator) {
  geolocation = navigator.geolocation;
}

const watchID = navigator.geolocation.watchPosition(locate, handleErr);

function locate(position) {
  const c = position.coords;

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

// map state
var map;
var ranger;
var locationMarker;
var images = [];

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
    </dl>
    <dl>
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
    const icon = L.icon({
      iconUrl: locationIcon,
      iconSize: [20, 20],
      iconAnchor: [10, 16],
    });
    locationMarker = L.marker(ll, { icon: icon }).addTo(map);
  } else {
    locationMarker.setLatLng(ll);
  }
}

var streaming = false;

function adjustAspectRatios(event) {
  const width = 320;
  const height = 240;
  const video = document.getElementById(VIDEO_ID);
  const canvas = document.getElementById(CANVAS_ID);

  if (!streaming) {
    video.setAttribute("width", width);
    video.setAttribute("height", height);
    video.setAttribute("position", "center");
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    streaming = true;
  }
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
  saveButton.disabled = true;
  saveButton.onclick = saveImageAndSetImageMarker;

  const cancelButton = document.getElementById(CANCEL_INPUT_ID);
  cancelButton.src = cancelImage;
  cancelButton.style.display = "inline";
  cancelButton.onclick = loadStartPage;

  const video = document.getElementById(VIDEO_ID);
  video.style.display = "block";
  video.addEventListener("canplay", adjustAspectRatios);

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

function pauseVideoAndTakePicture(event) {
  const video = document.getElementById(VIDEO_ID);
  const photo = document.getElementById(PHOTO_ID);
  const canvas = document.getElementById(CANVAS_ID);

  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  const playButton = document.getElementById(PLAY_INPUT_ID);
  const saveButton = document.getElementById(SAVE_INPUT_ID);
  pauseButton.style.display = "none";
  playButton.style.display = "inline";
  saveButton.disabled = false;

  video.pause();

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, video.width, video.height);
  imageData = canvas.toDataURL("image/jpeg");
  photo.setAttribute("src", imageData);
}

function playVideo(event) {
  const video = document.getElementById(VIDEO_ID);

  const pauseButton = document.getElementById(PAUSE_INPUT_ID);
  const playButton = document.getElementById(PLAY_INPUT_ID);
  const saveButton = document.getElementById(SAVE_INPUT_ID);
  pauseButton.style.display = "inline";
  playButton.style.display = "none";
  saveButton.disabled = true;

  video.play();
}

function saveImageAndSetImageMarker() {
  const photo = document.getElementById(PHOTO_ID);
  const ll = [locationMarker.getLatLng().lat, locationMarker.getLatLng().lng];
  data = photo.getAttribute("src");

  let image = {image: data, location: ll} 
  images.push(image);
  localStorage.setItem("photos", JSON.stringify(images));

  setImageMarker(data, ll)
  loadStartPage();
}

function setImageMarker(data, location) {
  const icon = L.icon({
    iconUrl: ArrowUpCircle,
    iconSize: [24, 24],
    iconAnchor: [12, 16],
  });

  let imageMarker = L.marker(location, { icon: icon }).addTo(map);
  imageMarker.bindPopup(
    `
    <div class="popup-image-container">
        <img class="popup-image" src="${data}" alt="Image">
        <div class="popup-text-overlay">
          ${COORD_FORMATTER.format(location[0])} ${COORD_FORMATTER.format(location[1])}
        </div>
    </div>
    `
  );
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

function loadImagesFromLocalStorage() {
  let photos = localStorage.getItem("photos") ? JSON.parse(localStorage.getItem("photos")) : [];
  images = photos;
  for (const photo of photos) {
    setImageMarker(photo.image, photo.location)
  }
}

window.onload = () => {
  document.getElementById(VIDEO_ID).style.display = "none";
  document.getElementById(CANVAS_ID).style.display = "none";
  document.getElementById(PHOTO_ID).style.display = "none";

  configureMap([47.406653, 9.744844]);
  loadImagesFromLocalStorage()
  const cameraButton = document.getElementById(CAMERA_INPUT_ID);
  cameraButton.src = cameraImage;
  cameraButton.onclick = loadCameraPage;

  if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(
          new URL('serviceworker.js', import.meta.url),
          { type: 'module' }
      ).then(() => {
          console.log('Service worker registered!');
      }).catch((error) => {
          console.warn('Error registering service worker:');
          console.warn(error);
      });
  }
};
