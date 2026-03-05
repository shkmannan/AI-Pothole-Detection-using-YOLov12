const API = {
  baseUrl: "http://localhost:8000",
  image: "/detect/image",
  video: "/detect/video",
  cameraStart: "/detect/camera/start",
  cameraStop: "/detect/camera/stop",
  health: "/health",
};

const logPanel = document.getElementById("logPanel");
const resultList = document.getElementById("resultList");
const confidence = document.getElementById("confidence");
const confidenceValue = document.getElementById("confidenceValue");

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imageDetect = document.getElementById("imageDetect");

const videoInput = document.getElementById("videoInput");
const videoPreview = document.getElementById("videoPreview");
const videoDetect = document.getElementById("videoDetect");

const cameraPreview = document.getElementById("cameraPreview");
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

const setResults = (items) => {
  resultList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.textContent = "No detections returned. Try another run.";
    resultList.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    resultList.appendChild(li);
  });
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

  const media = preview.querySelector("img, video");
  if (media) {
    media.style.maxWidth = "100%";
    media.style.borderRadius = "10px";
  }
};

const callApi = async (path, options = {}) => {
  const url = `${API.baseUrl}${path}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
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

  log("Starting camera stream...");
  try {
    await callApi(API.cameraStart, { method: "POST" });
    state.cameraActive = true;
    cameraPreview.textContent = "Camera running · awaiting detections";
    log("Camera stream started.", "success");
  } catch (error) {
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
    cameraPreview.textContent = "Camera idle";
    log("Camera stream stopped.", "success");
  } catch (error) {
    log(`Failed to stop camera: ${error.message}`, "error");
  }
});

healthButton.addEventListener("click", async () => {
  log("Checking API health...");
  try {
    const data = await callApi(API.health);
    log(`API is healthy: ${JSON.stringify(data)}`, "success");
  } catch (error) {
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

log("Ready to run detections.");
