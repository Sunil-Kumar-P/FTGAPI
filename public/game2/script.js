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
        //   drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        //     color: "#00FF00",
        //     lineWidth: 5,
        //   });
        //   drawLandmarks(canvasCtx, results.poseLandmarks, {
        //     color: "#FF0000",
        //     lineWidth: 2,
        //   });
          // Determine grid position
          const topHeight = (canvasElement.height /10)*4;
          const boxWidth = (canvasElement.width / 11)*4;
          const boxHeight = canvasElement.height / 3;
          
          canvasCtx.strokeStyle = 'white'; // White color
          canvasCtx.lineWidth = 1; // 1 pixel thickness
          canvasCtx.beginPath();
          canvasCtx.moveTo(boxWidth, 0);
          canvasCtx.lineTo(boxWidth, canvasElement.height);
          canvasCtx.moveTo(canvasElement.width - boxWidth, 0);
          canvasCtx.lineTo(canvasElement.width - boxWidth, canvasElement.height);
          canvasCtx.stroke();
          canvasCtx.beginPath();
          canvasCtx.moveTo(0, topHeight);
          canvasCtx.lineTo(canvasElement.width, topHeight);
          canvasCtx.moveTo(0, boxHeight * 2);
          canvasCtx.lineTo(canvasElement.width, boxHeight * 2);
          canvasCtx.stroke();
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
          // console.log('Center Point Location:', centerPoint);
          var gridPosition = {
            left: centerPoint.x * canvasElement.width < boxWidth,
            right: centerPoint.x * canvasElement.width > canvasElement.width - boxWidth,
            top: centerPoint.y * canvasElement.height < topHeight,
            bottom: centerPoint.y * canvasElement.height > boxHeight * 2,
            moving: false,
            restart: false,
          };
          // Update gridPosition to include center
          gridPosition.center = !gridPosition.left && !gridPosition.right;
          var moving = false;
  
          var yrh = results.poseLandmarks[24].y;
          var yrk = results.poseLandmarks[26].y;
          var yra = results.poseLandmarks[28].y;
  
          var ylh = results.poseLandmarks[23].y;
          var ylk = results.poseLandmarks[25].y;
          var yla = results.poseLandmarks[27].y;
  
          var disLeftK = yla - ylk;
          var disLeftH = ylk - ylh;
  
          var disRightK = yra - yrk;
          var disRightH = yrk - yrh;
  
          if (disLeftH < 0.15 || disLeftK <0.15) {
            gridPosition.moving = true;
          }
          if (disRightH < 0.15 || disRightK <0.15) {
            gridPosition.moving = true;
          }
  
          // Display position text on the bottom corner
          canvasCtx.fillStyle = gridPosition.center ? '#0000FF' : '#FFFFFF'; // Blue color if center, white otherwise
          canvasCtx.font = '40px Arial';
          canvasCtx.fillText(`moving  ${gridPosition.moving} `, 10, canvasElement.height - 10);
  
          // Send data to server
          sendMediaPipePointsToServer(gridPosition);
          console.log(" " + disLeftH+ " "+ disLeftK);
          console.log(" " + disRightH+ " "+ disRightK);
          console.log("moving = " + gridPosition.moving);
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
      selfieMode: true
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
  
    function sendMediaPipePointsToServer(gridPosition) {
      fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({gridPosition: gridPosition }),
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
  