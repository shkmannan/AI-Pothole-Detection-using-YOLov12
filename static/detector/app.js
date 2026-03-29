const API = {
  health: "/health/",
  image: "/api/detect/image/",
  video: "/api/detect/video/",
  frame: "/api/detect/frame/",
  reports: "/api/reports/",
  createReport: "/api/reports/create/",
};

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? "";

const state = {
  stream: null,
  liveDetection: false,
  frameDelayMs: 900,
  isSendingFrame: false,
  map: null,
  reportsLayer: null,
  userMarker: null,
  accuracyCircle: null,
  currentLocation: null,
  latestDetection: null,
  lastReportSignature: null,
  lastReportAt: 0,
  autoReportEnabled: true,
};

const logPanel = document.getElementById("logPanel");
const resultList = document.getElementById("resultList");
const resultPreview = document.getElementById("resultPreview");
const resultsBadge = document.getElementById("resultsBadge");
const apiStatus = document.getElementById("apiStatus");
const confidence = document.getElementById("confidence");
const confidenceValue = document.getElementById("confidenceValue");

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imageDetect = document.getElementById("imageDetect");

const videoInput = document.getElementById("videoInput");
const videoPreview = document.getElementById("videoPreview");
const videoDetect = document.getElementById("videoDetect");

const cameraStart = document.getElementById("cameraStart");
const cameraStop = document.getElementById("cameraStop");
const liveDetectStart = document.getElementById("liveDetectStart");
const liveDetectStop = document.getElementById("liveDetectStop");
const cameraFeed = document.getElementById("cameraFeed");
const cameraOverlay = document.getElementById("cameraOverlay");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const captureCanvas = document.getElementById("captureCanvas");

const healthButton = document.getElementById("healthButton");
const runDemo = document.getElementById("runDemo");
const downloadReport = document.getElementById("downloadReport");
const locationStatus = document.getElementById("locationStatus");
const enableLocation = document.getElementById("enableLocation");
const refreshReports = document.getElementById("refreshReports");
const autoReportToggle = document.getElementById("autoReportToggle");
const reportLatest = document.getElementById("reportLatest");
const reportStatus = document.getElementById("reportStatus");
const reportFeed = document.getElementById("reportFeed");
const mapCanvas = document.getElementById("mapCanvas");

const log = (message, level = "info") => {
  const row = document.createElement("p");
  const prefix = level === "error" ? "[error]" : level === "success" ? "[ok]" : "[info]";
  row.textContent = `${prefix} ${message}`;
  logPanel.prepend(row);
};

const setApiStatus = (text, tone = "neutral") => {
  apiStatus.textContent = text;
  if (tone === "ok") {
    apiStatus.style.background = "#ddf9e6";
    apiStatus.style.borderColor = "#9fdcb2";
    apiStatus.style.color = "#1e6a35";
    return;
  }
  if (tone === "error") {
    apiStatus.style.background = "#ffe4e4";
    apiStatus.style.borderColor = "#f0b2b2";
    apiStatus.style.color = "#8a2424";
    return;
  }
  apiStatus.style.background = "#f2f6ff";
  apiStatus.style.borderColor = "rgba(20, 44, 87, 0.18)";
  apiStatus.style.color = "#2c4d89";
};

const showCameraState = ({ streamActive = false, annotated = false, message = "Camera idle" }) => {
  cameraFeed.style.display = streamActive ? "block" : "none";
  cameraOverlay.style.display = annotated ? "block" : "none";
  cameraPlaceholder.style.display = streamActive || annotated ? "none" : "grid";
  cameraPlaceholder.textContent = message;
};

const setResults = (items) => {
  resultList.innerHTML = "";
  if (!items.length) {
    const row = document.createElement("li");
    row.textContent = "No detections returned.";
    resultList.appendChild(row);
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("li");
    row.textContent = item;
    resultList.appendChild(row);
  });
};

const setPreviewContent = (container, source, tagName) => {
  if (!source) {
    container.textContent = "No preview available.";
    return;
  }
  container.innerHTML = "";
  const element = document.createElement(tagName);
  element.src = source;
  if (tagName === "video") {
    element.controls = true;
  }
  container.appendChild(element);
};

const updateFilePreview = (container, file) => {
  if (!file) {
    container.textContent = "No file selected.";
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  if (file.type.startsWith("image/")) {
    setPreviewContent(container, objectUrl, "img");
    return;
  }
  if (file.type.startsWith("video/")) {
    setPreviewContent(container, objectUrl, "video");
    return;
  }
  container.textContent = file.name;
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "X-CSRFToken": csrfToken,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload.detail) {
        detail = payload.detail;
      }
    } catch (_error) {
      // Keep default error.
    }
    throw new Error(detail);
  }
  return response.json();
};

const renderAnnotatedImage = (dataUrl) => {
  if (!dataUrl) {
    resultPreview.textContent = "Annotated output appears here.";
    return;
  }
  setPreviewContent(resultPreview, dataUrl, "img");
};

const formatTimestamp = (value) => {
  if (!value) {
    return "Unknown time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString();
};

const setReportStatus = (message) => {
  reportStatus.textContent = message;
};

const updateLocationStatus = (message) => {
  locationStatus.textContent = message;
};

const buildDetectionSummary = (source, count, avgConfidence = 0) => ({
  source,
  detectionsCount: Number(count ?? 0),
  avgConfidence: Number(avgConfidence ?? 0),
});

const reportSignature = (detection, location) =>
  [
    detection.source,
    detection.detectionsCount,
    detection.avgConfidence.toFixed(3),
    location.latitude.toFixed(5),
    location.longitude.toFixed(5),
  ].join("|");

const ensureMap = () => {
  if (state.map || typeof window.L === "undefined" || !mapCanvas) {
    return;
  }

  state.map = window.L.map(mapCanvas, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([20.5937, 78.9629], 5);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(state.map);

  state.reportsLayer = window.L.layerGroup().addTo(state.map);
};

const renderReportFeed = (reports) => {
  reportFeed.innerHTML = "";
  if (!reports.length) {
    const empty = document.createElement("p");
    empty.className = "report-feed__empty";
    empty.textContent = "No municipality reports yet.";
    reportFeed.appendChild(empty);
    return;
  }

  reports.forEach((report) => {
    const item = document.createElement("article");
    item.className = "report-feed__item";

    const title = document.createElement("p");
    title.className = "report-feed__title";
    title.textContent = `${report.detections_count} pothole(s) from ${report.source}`;

    const meta = document.createElement("p");
    meta.className = "report-feed__meta";
    meta.textContent =
      `${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)} ` +
      `| conf ${Number(report.avg_confidence ?? 0).toFixed(2)} ` +
      `| ${formatTimestamp(report.created_at)}`;

    item.append(title, meta);
    reportFeed.appendChild(item);
  });
};

const renderReportsOnMap = (reports) => {
  ensureMap();
  if (!state.reportsLayer) {
    return;
  }

  state.reportsLayer.clearLayers();
  const bounds = [];

  reports.forEach((report) => {
    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    const marker = window.L.marker([latitude, longitude]);
    marker.bindPopup(
      `<strong>${report.detections_count} pothole(s)</strong><br>` +
        `Source: ${report.source}<br>` +
        `Confidence: ${Number(report.avg_confidence ?? 0).toFixed(2)}<br>` +
        `Reported: ${formatTimestamp(report.created_at)}`,
    );
    marker.addTo(state.reportsLayer);
    bounds.push([latitude, longitude]);
  });

  if (state.currentLocation) {
    bounds.push([state.currentLocation.latitude, state.currentLocation.longitude]);
  }

  if (bounds.length) {
    state.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  }
};

const loadReports = async ({ silent = false } = {}) => {
  try {
    const data = await apiRequest(API.reports);
    const reports = data.reports ?? [];
    renderReportFeed(reports);
    renderReportsOnMap(reports);
    if (!silent) {
      log(`Loaded ${reports.length} municipality report(s).`, "success");
    }
  } catch (error) {
    renderReportFeed([]);
    log(`Could not load reports: ${error.message}`, "error");
  }
};

const updateUserLocationOnMap = () => {
  ensureMap();
  if (!state.map || !state.currentLocation) {
    return;
  }

  const coords = [state.currentLocation.latitude, state.currentLocation.longitude];
  if (!state.userMarker) {
    state.userMarker = window.L.circleMarker(coords, {
      radius: 8,
      color: "#0b5fff",
      weight: 2,
      fillColor: "#78a7ff",
      fillOpacity: 0.9,
    }).addTo(state.map);
  } else {
    state.userMarker.setLatLng(coords);
  }

  if (!state.accuracyCircle) {
    state.accuracyCircle = window.L.circle(coords, {
      radius: state.currentLocation.accuracy ?? 0,
      color: "#0b5fff",
      weight: 1,
      fillColor: "#78a7ff",
      fillOpacity: 0.12,
    }).addTo(state.map);
  } else {
    state.accuracyCircle.setLatLng(coords);
    state.accuracyCircle.setRadius(state.currentLocation.accuracy ?? 0);
  }

  state.userMarker.bindPopup("Current device location");
  state.map.setView(coords, 16);
};

const requestLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });

const saveReport = async (detection, { force = false } = {}) => {
  if (!detection || detection.detectionsCount <= 0) {
    if (force) {
      throw new Error("No pothole detection is available to report.");
    }
    return null;
  }
  if (!state.currentLocation) {
    if (force) {
      throw new Error("Enable device location before reporting.");
    }
    return null;
  }

  const signature = reportSignature(detection, state.currentLocation);
  const now = Date.now();
  const duplicateWindowMs = 45000;
  if (!force && signature === state.lastReportSignature && now - state.lastReportAt < duplicateWindowMs) {
    return null;
  }

  const payload = {
    source: detection.source,
    latitude: state.currentLocation.latitude,
    longitude: state.currentLocation.longitude,
    detections_count: detection.detectionsCount,
    avg_confidence: detection.avgConfidence,
    accuracy_m: state.currentLocation.accuracy,
  };

  const report = await apiRequest(API.createReport, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  state.lastReportSignature = signature;
  state.lastReportAt = now;
  setReportStatus(
    `Reported ${report.detections_count} pothole(s) at ${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)}.`,
  );
  log("Municipality report saved.", "success");
  await loadReports({ silent: true });
  return report;
};

const maybeAutoReport = async () => {
  if (!state.autoReportEnabled || !state.latestDetection || state.latestDetection.detectionsCount <= 0) {
    return;
  }

  try {
    await saveReport(state.latestDetection);
  } catch (error) {
    log(`Auto-report failed: ${error.message}`, "error");
  }
};

const recordDetection = async (detection) => {
  state.latestDetection = detection;
  if (detection.detectionsCount > 0) {
    setReportStatus(
      `Latest detection: ${detection.detectionsCount} pothole(s) from ${detection.source}.`,
    );
    await maybeAutoReport();
    return;
  }

  setReportStatus(`Latest detection from ${detection.source} found no potholes.`);
};

const captureFrameBlob = () =>
  new Promise((resolve, reject) => {
    const width = cameraFeed.videoWidth;
    const height = cameraFeed.videoHeight;
    if (!width || !height) {
      reject(new Error("Camera is not ready."));
      return;
    }

    captureCanvas.width = width;
    captureCanvas.height = height;
    const context = captureCanvas.getContext("2d");
    context.drawImage(cameraFeed, 0, 0, width, height);
    captureCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not capture camera frame."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.82,
    );
  });

const stopLiveDetection = () => {
  state.liveDetection = false;
  state.isSendingFrame = false;
  resultsBadge.textContent = "Live detection stopped";
};

const runLiveDetection = async () => {
  if (!state.liveDetection || !state.stream || state.isSendingFrame) {
    return;
  }

  state.isSendingFrame = true;
  try {
    const frameBlob = await captureFrameBlob();
    const form = new FormData();
    form.append("frame", frameBlob, "camera-frame.jpg");
    form.append("confidence", confidence.value);

    const data = await apiRequest(API.frame, {
      method: "POST",
      body: form,
    });

    cameraOverlay.src = data.annotated_image;
    showCameraState({ streamActive: true, annotated: true });
    renderAnnotatedImage(data.annotated_image);
    resultsBadge.textContent = "Live detection running";
    setResults([
      `Live detections: ${data.count ?? 0}`,
      `Average confidence: ${(data.avg_confidence ?? 0).toFixed(2)}`,
      "Source: browser rear camera",
    ]);
    await recordDetection(
      buildDetectionSummary("live-camera", data.count ?? 0, data.avg_confidence ?? 0),
    );
  } catch (error) {
    log(`Live detection failed: ${error.message}`, "error");
    stopLiveDetection();
  } finally {
    state.isSendingFrame = false;
  }

  if (state.liveDetection) {
    window.setTimeout(runLiveDetection, state.frameDelayMs);
  }
};

const startPhoneCamera = async () => {
  if (state.stream) {
    showCameraState({ streamActive: true, annotated: Boolean(cameraOverlay.src) });
    return;
  }

  const constraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  state.stream = await navigator.mediaDevices.getUserMedia(constraints);
  cameraFeed.srcObject = state.stream;
  await cameraFeed.play();
  showCameraState({ streamActive: true, annotated: false });
};

const stopPhoneCamera = () => {
  stopLiveDetection();
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
  }
  state.stream = null;
  cameraFeed.srcObject = null;
  cameraOverlay.removeAttribute("src");
  showCameraState({ streamActive: false, annotated: false, message: "Camera idle" });
};

confidence.addEventListener("input", () => {
  confidenceValue.textContent = Number(confidence.value).toFixed(2);
});

imageInput.addEventListener("change", (event) => {
  updateFilePreview(imagePreview, event.target.files[0]);
});

videoInput.addEventListener("change", (event) => {
  updateFilePreview(videoPreview, event.target.files[0]);
});

imageDetect.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    log("Select an image before running detection.", "error");
    return;
  }

  const form = new FormData();
  form.append("image", file);
  form.append("confidence", confidence.value);

  log("Uploading image for detection...");
  try {
    const data = await apiRequest(API.image, {
      method: "POST",
      body: form,
    });
    renderAnnotatedImage(data.annotated_image);
    resultsBadge.textContent = "Image analyzed";
    setResults([
      `Filename: ${data.filename ?? file.name}`,
      `Detected potholes: ${data.count ?? 0}`,
      `Average confidence: ${(data.avg_confidence ?? 0).toFixed(2)}`,
    ]);
    await recordDetection(
      buildDetectionSummary("image-upload", data.count ?? 0, data.avg_confidence ?? 0),
    );
    log("Image detection complete.", "success");
  } catch (error) {
    log(`Image detection failed: ${error.message}`, "error");
  }
});

videoDetect.addEventListener("click", async () => {
  const file = videoInput.files[0];
  if (!file) {
    log("Select a video before running analysis.", "error");
    return;
  }

  const form = new FormData();
  form.append("video", file);
  form.append("confidence", confidence.value);

  log("Uploading video for analysis...");
  try {
    const data = await apiRequest(API.video, {
      method: "POST",
      body: form,
    });
    renderAnnotatedImage(data.preview_image);
    resultsBadge.textContent = "Video analyzed";
    setResults([
      `Frames seen: ${data.frames_seen ?? 0}`,
      `Frames processed: ${data.frames_processed ?? 0}`,
      `Total pothole detections: ${data.count ?? 0}`,
      `Peak potholes in one sampled frame: ${data.peak_detections ?? 0}`,
      `Sampling stride: every ${data.stride ?? 1} frame(s)`,
    ]);
    await recordDetection(
      buildDetectionSummary("video-upload", data.peak_detections ?? data.count ?? 0, 0),
    );
    log("Video analysis complete.", "success");
  } catch (error) {
    log(`Video analysis failed: ${error.message}`, "error");
  }
});

cameraStart.addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    log("This browser does not support camera access.", "error");
    return;
  }

  log("Requesting phone camera access...");
  try {
    await startPhoneCamera();
    log("Phone camera started.", "success");
  } catch (error) {
    showCameraState({
      streamActive: false,
      annotated: false,
      message: "Camera permission denied or unavailable",
    });
    log(`Camera start failed: ${error.message}`, "error");
  }
});

cameraStop.addEventListener("click", () => {
  stopPhoneCamera();
  log("Phone camera stopped.");
});

liveDetectStart.addEventListener("click", async () => {
  try {
    if (!state.stream) {
      await startPhoneCamera();
    }
    if (state.liveDetection) {
      log("Live detection is already running.");
      return;
    }
    state.liveDetection = true;
    resultsBadge.textContent = "Live detection starting";
    log("Live detection started.", "success");
    runLiveDetection();
  } catch (error) {
    log(`Could not start live detection: ${error.message}`, "error");
  }
});

liveDetectStop.addEventListener("click", () => {
  stopLiveDetection();
  log("Live detection stopped.");
});

healthButton.addEventListener("click", async () => {
  log("Checking API health...");
  try {
    const data = await apiRequest(API.health);
    setApiStatus(`API: ${data.status}`, "ok");
    log(`API is healthy. Model path: ${data.model_path}`, "success");
  } catch (error) {
    setApiStatus("API: Offline", "error");
    log(`API health check failed: ${error.message}`, "error");
  }
});

enableLocation.addEventListener("click", async () => {
  log("Requesting device location...");
  try {
    const position = await requestLocation();
    state.currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
    updateLocationStatus(
      `Location ready at ${state.currentLocation.latitude.toFixed(5)}, ${state.currentLocation.longitude.toFixed(5)} (±${Math.round(state.currentLocation.accuracy ?? 0)} m).`,
    );
    updateUserLocationOnMap();
    log("Device location captured.", "success");
    if (state.latestDetection?.detectionsCount > 0) {
      await maybeAutoReport();
    }
  } catch (error) {
    updateLocationStatus("Location permission denied or unavailable.");
    log(`Could not get device location: ${error.message}`, "error");
  }
});

refreshReports.addEventListener("click", async () => {
  log("Refreshing municipality reports...");
  await loadReports();
});

autoReportToggle.addEventListener("change", (event) => {
  state.autoReportEnabled = event.target.checked;
  setReportStatus(
    state.autoReportEnabled
      ? "Auto-report is enabled for new pothole detections."
      : "Auto-report is disabled. Use the manual report button when needed.",
  );
});

reportLatest.addEventListener("click", async () => {
  try {
    await saveReport(state.latestDetection, { force: true });
  } catch (error) {
    log(`Manual report failed: ${error.message}`, "error");
    setReportStatus(error.message);
  }
});

runDemo.addEventListener("click", () => {
  setResults([
    "Deployment target: Render web service",
    "Camera source: current phone browser session",
    "HTTPS required for camera permissions on production",
    "Live frames are uploaded to Django for YOLO inference",
  ]);
  resultsBadge.textContent = "Demo mode";
  resultPreview.textContent = "Run a real scan to see annotated output.";
  log("Demo summary loaded.", "success");
});

downloadReport.addEventListener("click", () => {
  const content = [
    "segment,source,severity,confidence",
    "NH-48,phone-camera,high,0.78",
    "Ward-12,survey-video,medium,0.61",
  ].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pothole-report.csv";
  link.click();
  log("Sample report downloaded.", "success");
});

ensureMap();
loadReports({ silent: true });
setReportStatus("Auto-report is enabled for new pothole detections.");
showCameraState({ streamActive: false, annotated: false, message: "Camera idle" });
log("Open this page on a phone to use that device's camera.");
