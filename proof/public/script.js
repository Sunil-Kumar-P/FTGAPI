document.addEventListener("DOMContentLoaded", function () {
  const videoElement = document.getElementsByClassName("input_video")[0];
  const canvasElement = document.getElementsByClassName("output_canvas")[0];
  const canvasCtx = canvasElement.getContext("2d");

  function onResults(results) {
    try {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5,
        });
        drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
        // Calculate center point
        const centerPoint = {
          x: (results.poseLandmarks[11].x + results.poseLandmarks[12].x + results.poseLandmarks[23].x + results.poseLandmarks[24].x) / 4,
          y: (results.poseLandmarks[11].y + results.poseLandmarks[12].y + results.poseLandmarks[23].y + results.poseLandmarks[24].y) / 4
        };
        // Draw center point
        canvasCtx.fillStyle = '#0000FF'; // Blue color
        canvasCtx.beginPath();
        canvasCtx.arc(centerPoint.x * canvasElement.width, centerPoint.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fill();
        // Print center point location on the console
        console.log('Center Point Location:', centerPoint);

        // Determine grid position
        const boxWidth = canvasElement.width / 3;
        const boxHeight = canvasElement.height / 3;
        const gridPosition = {
          left: centerPoint.x < boxWidth,
          right: centerPoint.x > boxWidth * 2,
          center: centerPoint.x >= boxWidth && centerPoint.x <= boxWidth * 2,
          top: centerPoint.y < boxHeight,
          bottom: centerPoint.y > boxHeight * 2
        };

        // Send data to server
        sendMediaPipePointsToServer(results.poseLandmarks, gridPosition);
      }
      canvasCtx.restore();
    } catch (error) {
      console.log("error", error);
    }
  }

  const pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    },
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  pose.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720,
  });
  camera.start();

  function sendMediaPipePointsToServer(points, gridPosition) {
    fetch('http://localhost:3000/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ points: points, gridPosition: gridPosition }), // Include gridPosition in the request body
    })
      .then(response => response.json())
      .then(data => {
        console.log('Server response:', data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
});