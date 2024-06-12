// Configura la cámara y el video para la transmisión en tiempo real
async function setupCamera() {
  // Crea un elemento de video y establece sus atributos
  const video = document.createElement('video');
  video.width = 640;
  video.height = 480;
  video.autoplay = true;
  
  // Solicita acceso a la cámara y obtiene el stream de video
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  // Devuelve una promesa que se resuelve cuando se cargan los metadatos del video
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

// Carga el modelo MoveNet para la detección de poses
async function loadModel() {
  // Configura el detector con el tipo de modelo SINGLEPOSE_LIGHTNING
  const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
  
  // Crea y devuelve el detector MoveNet
  return await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
}

// Dibuja los puntos clave en el canvas
function drawKeypoints(keypoints, ctx) {
  keypoints.forEach((keypoint) => {
    // Solo dibuja puntos clave con una puntuación de confianza superior a 0.5
    if (keypoint.score > 0.5) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
}

// Dibuja el esqueleto conectando los puntos clave en el canvas
function drawSkeleton(keypoints, ctx) {
  // Obtiene los pares de puntos clave adyacentes para formar el esqueleto
  const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

  adjacentKeyPoints.forEach((pair) => {
    const [i, j] = pair;
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    // Solo dibuja líneas entre puntos clave con una puntuación de confianza superior a 0.5
    if (kp1.score > 0.5 && kp2.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Detecta poses en el video y dibuja los resultados en el canvas
async function detectPoses(video, detector) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  // Función para la detección de poses en cada frame del video
  async function poseDetectionFrame() {
    // Estima las poses en el frame actual del video
    const poses = await detector.estimatePoses(video);
    
    // Limpia el canvas y dibuja el video en él
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Dibuja los puntos clave y el esqueleto en el canvas para cada pose detectada
    poses.forEach((pose) => {
      drawKeypoints(pose.keypoints, ctx);
      drawSkeleton(pose.keypoints, ctx);
    });

    // Solicita la siguiente animación de frame
    requestAnimationFrame(poseDetectionFrame);
  }

  // Inicia la detección de poses
  poseDetectionFrame();
}

// Función principal que coordina la configuración de la cámara y el modelo, y comienza la detección de poses
async function main() {
  const loadingMessage = document.getElementById('loading-message');
  loadingMessage.style.display = 'block';

  // Configura la cámara y obtiene el elemento de video
  const video = await setupCamera();
  video.play();

  // Carga el modelo de detección de poses
  const detector = await loadModel();
  
  // Oculta el mensaje de carga y muestra el canvas
  loadingMessage.style.display = 'none';
  const canvas = document.getElementById('output');
  canvas.style.display = 'block';

  // Inicia la detección de poses
  detectPoses(video, detector);
}

// Añade un evento de clic al botón de inicio para comenzar la aplicación
document.getElementById('start-button').addEventListener('click', () => {
  document.getElementById('start-button').style.display = 'none';
  main();
});
