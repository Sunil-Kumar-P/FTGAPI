// Mouse Controller
const cursor = document.getElementById("cursor");

function moveCursor(middleFingerMCP,middleFingerTip, mfcp) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const imageWidth = cursor.clientWidth;
    const imageHeight = cursor.clientHeight;

    // Convert normalized coordinates to actual window coordinates
    const x = mfcp.x * window.innerWidth;
    const y = mfcp.y * window.innerHeight;

    // Calculate new position for the cursor image
    const newX = Math.max(0, Math.min(windowWidth - imageWidth, x));
    const newY = Math.max(0, Math.min(windowHeight - imageHeight, y));

    // Set the new position
    cursor.style.left = newX + "px";
    cursor.style.top = newY + "px";
    checkHoverEffect(newX, newY, middleFingerMCP, middleFingerTip);
}
// Function to check for hover effect on <li> elements
function checkHoverEffect(cursorX, cursorY,  middleFingerMCP, middleFingerTip) {
    const alink = document.querySelectorAll("a");
    alink.forEach(ali => {
        const rect = ali.getBoundingClientRect();
        if (
            cursorX >= rect.left &&
            cursorX <= rect.right &&
            cursorY >= rect.top &&
            cursorY <= rect.bottom
        ) {
            if(middleFingerMCP.y > middleFingerTip.y){
                ali.click();
            }
           
        } 
        // else {
        //     li.classList.remove("hovered");
        // }
    });
}
document.addEventListener("DOMContentLoaded", function () {
    const videoElement = document.getElementsByClassName('input_video')[0];
    const canvasElement = document.getElementsByClassName('output_canvas')[0];
    const canvasCtx = canvasElement.getContext('2d');

    // MediaPipe Hands setup
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true
    });
    hands.onResults(onResults);

    // Camera setup
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({
                image: videoElement
            });
        },
        width: 1280,
        height: 720
        
    });

    // Start camera
    camera.start();

    // Function to handle hand tracking results
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasElement.width,
            canvasElement.height
        );

        if (results.multiHandLandmarks) {
            for (const hand of results.multiHandLandmarks) {
                // Get coordinates of point number 9 (index finger tip)
                const middleFingerTip = hand[9]; // Index 8 represents the index finger tip
                const middleFingerMCP = hand[12];
                const mfcp = hand[0];
                

                // Move the cursor to the new position
                moveCursor(middleFingerMCP, middleFingerTip, mfcp);
            }
        }
        canvasCtx.restore();
    }
});