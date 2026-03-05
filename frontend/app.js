const API = {
  baseUrl: "http://localhost:8000",
  image: "/detect/image",
  video: "/detect/video",
  cameraStart: "/detect/camera/start",
  cameraStop: "/detect/camera/stop",
  cameraStatus: "/detect/camera/status",
  cameraStream: "/detect/camera/stream",
  health: "/health",
};

const logPanel = document.getElementById("logPanel");
const resultList = document.getElementById("resultList");
const confidence = document.getElementById("confidence");
const confidenceValue = document.getElementById("confidenceValue");
const detectedCount = document.getElementById("detectedCount");
const resultsBadge = document.getElementById("resultsBadge");
const apiStatus = document.getElementById("apiStatus");

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imageDetect = document.getElementById("imageDetect");

const videoInput = document.getElementById("videoInput");
const videoPreview = document.getElementById("videoPreview");
const videoDetect = document.getElementById("videoDetect");

const cameraUrl = document.getElementById("cameraUrl");
const cameraStream = document.getElementById("cameraStream");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const cameraStart = document.getElementById("cameraStart");
const cameraStop = document.getElementById("cameraStop");

const healthButton = document.getElementById("healthButton");
const runDemo = document.getElementById("runDemo");
const downloadReport = document.getElementById("downloadReport");

const state = {
  cameraActive: false,
};

const log = (message, level = "info") => {
  const line = document.createElement("p");
  const prefix = level === "error" ? "[error]" : level === "success" ? "[ok]" : "[info]";
  line.textContent = `${prefix} ${message}`;
  logPanel.prepend(line);
};

const setApiStatusChip = (text, tone = "neutral") => {
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

const setResults = (items) => {
  resultList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.textContent = "No detections returned. Try another run.";
    resultList.appendChild(empty);
    resultsBadge.textContent = "No detections";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    resultList.appendChild(li);
  });
  resultsBadge.textContent = "Run completed";
};

const showCameraState = (active, message) => {
  if (active) {
    cameraPlaceholder.style.display = "none";
    cameraStream.style.display = "block";
  } else {
    cameraStream.style.display = "none";
    cameraPlaceholder.style.display = "block";
    cameraPlaceholder.textContent = message;
  }
};

const updatePreview = (preview, file) => {
  if (!file) {
    preview.textContent = "No file selected.";
    return;
  }

  const url = URL.createObjectURL(file);
  if (file.type.startsWith("image/")) {
    preview.innerHTML = `<img src="${url}" alt="preview" />`;
  } else if (file.type.startsWith("video/")) {
    preview.innerHTML = `<video src="${url}" controls></video>`;
  } else {
    preview.textContent = `Selected: ${file.name}`;
  }
};

const callApi = async (path, options = {}) => {
  const url = `${API.baseUrl}${path}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    let detail = `API error (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail) {
        detail = data.detail;
      }
    } catch (_error) {
      // Use default error text.
    }
    throw new Error(detail);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
};

const startCameraStream = async () => {
  const streamPath = `${API.cameraStream}?t=${Date.now()}`;
  cameraStream.onerror = () => {
    showCameraState(false, "Stream disconnected");
    state.cameraActive = false;
    log("Live stream disconnected. Check camera URL and backend logs.", "error");
  };
  cameraStream.src = `${API.baseUrl}${streamPath}`;
  showCameraState(true, "");
};

const stopCameraStream = () => {
  cameraStream.removeAttribute("src");
  cameraStream.src = "";
  showCameraState(false, "Camera idle");
};

const refreshCameraStatus = async () => {
  try {
    const status = await callApi(API.cameraStatus);
    state.cameraActive = Boolean(status.active);
    if (status.camera_url) {
      cameraUrl.value = status.camera_url;
    }

    if (state.cameraActive) {
      await startCameraStream();
      log("Reconnected to active camera stream.", "success");
    } else {
      stopCameraStream();
    }
  } catch (_error) {
    stopCameraStream();
  }
};

confidence.addEventListener("input", () => {
  confidenceValue.textContent = Number(confidence.value).toFixed(2);
});

imageInput.addEventListener("change", (event) => {
  updatePreview(imagePreview, event.target.files[0]);
});

videoInput.addEventListener("change", (event) => {
  updatePreview(videoPreview, event.target.files[0]);
});

imageDetect.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    log("Select an image before running detection.", "error");
    return;
  }

  log("Uploading image for detection...");
  try {
    const form = new FormData();
    form.append("image", file);
    form.append("confidence", confidence.value);

    const data = await callApi(API.image, {
      method: "POST",
      body: form,
    });

    setResults([
      `Detected potholes: ${data.count ?? "n/a"}`,
      `Avg confidence: ${data.avg_confidence ?? "n/a"}`,
      `Image saved: ${data.output ?? "output.jpg"}`,
    ]);

    if (typeof data.count === "number") {
      detectedCount.textContent = String(Number(detectedCount.textContent) + data.count);
    }

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

  log("Uploading video for analysis...");
  try {
    const form = new FormData();
    form.append("video", file);
    form.append("confidence", confidence.value);

    const data = await callApi(API.video, {
      method: "POST",
      body: form,
    });

    setResults([
      `Frames processed: ${data.frames ?? "n/a"}`,
      `Total potholes: ${data.count ?? "n/a"}`,
      `Highlights: ${data.highlights ?? "n/a"}`,
    ]);

    if (typeof data.count === "number") {
      detectedCount.textContent = String(Number(detectedCount.textContent) + data.count);
    }

    log("Video analysis complete.", "success");
  } catch (error) {
    log(`Video analysis failed: ${error.message}`, "error");
  }
});

cameraStart.addEventListener("click", async () => {
  if (state.cameraActive) {
    log("Camera stream already active.");
    return;
  }

  const source = cameraUrl.value.trim();
  if (!source) {
    log("Enter a camera URL before starting the stream.", "error");
    return;
  }

  log("Starting camera stream...");
  try {
    const payload = {
      camera_url: source,
      confidence: Number(confidence.value),
    };

    await callApi(API.cameraStart, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    state.cameraActive = true;
    await startCameraStream();
    resultsBadge.textContent = "Live stream running";
    log("Camera stream started.", "success");
  } catch (error) {
    stopCameraStream();
    log(`Failed to start camera: ${error.message}`, "error");
  }
});

cameraStop.addEventListener("click", async () => {
  if (!state.cameraActive) {
    log("Camera is not active.");
    return;
  }

  log("Stopping camera stream...");
  try {
    await callApi(API.cameraStop, { method: "POST" });
    state.cameraActive = false;
    stopCameraStream();
    resultsBadge.textContent = "Stream stopped";
    log("Camera stream stopped.", "success");
  } catch (error) {
    log(`Failed to stop camera: ${error.message}`, "error");
  }
});

healthButton.addEventListener("click", async () => {
  log("Checking API health...");
  try {
    const data = await callApi(API.health);
    setApiStatusChip("API: Online", "ok");
    log(`API is healthy: ${JSON.stringify(data)}`, "success");
  } catch (error) {
    setApiStatusChip("API: Offline", "error");
    log(`API health check failed: ${error.message}`, "error");
  }
});

runDemo.addEventListener("click", () => {
  setResults([
    "Detected potholes: 14",
    "Avg confidence: 0.62",
    "Critical segments: NH-48, Sector 12",
    "Exported report: report_2026-03-06.csv",
  ]);
  resultsBadge.textContent = "Demo mode";
  log("Demo data loaded.", "success");
});

downloadReport.addEventListener("click", () => {
  const content = [
    "segment,latitude,longitude,severity,confidence",
    "NH-48,28.6139,77.2090,high,0.78",
    "Sector 12,28.6501,77.1902,medium,0.61",
  ].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pothole-report.csv";
  link.click();
  log("Sample report downloaded.", "success");
});

showCameraState(false, "Camera idle");
refreshCameraStatus();
log("Ready to run detections.");
