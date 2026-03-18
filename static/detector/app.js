const API = {
  health: "/health/",
  image: "/api/detect/image/",
  video: "/api/detect/video/",
  frame: "/api/detect/frame/",
};

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? "";

const state = {
  stream: null,
  liveDetection: false,
  frameDelayMs: 900,
  isSendingFrame: false,
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

showCameraState({ streamActive: false, annotated: false, message: "Camera idle" });
log("Open this page on a phone to use that device's camera.");
