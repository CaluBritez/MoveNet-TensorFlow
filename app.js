async function setupCamera() {
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
    video.srcObject = stream;
  
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }
  
  async function loadModel() {
    const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
    return await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
  }
  
  async function detectPoses(video, detector) {
    const canvas = document.getElementById('output');
    const ctx = canvas.getContext('2d');
  
    async function poseDetectionFrame() {
      const poses = await detector.estimatePoses(video);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      poses.forEach(pose => {
        pose.keypoints.forEach(keypoint => {
          if (keypoint.score > 0.5) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        });
      });
  
      requestAnimationFrame(poseDetectionFrame);
    }
  
    poseDetectionFrame();
  }
  
  async function main() {
    const video = await setupCamera();
    video.play();
  
    const detector = await loadModel();
    detectPoses(video, detector);
  }
  
  main();