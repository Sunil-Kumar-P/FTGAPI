
function Walking(results) {
  try {
    if (results.poseLandmarks) {
      const currentTime = Date.now(); // saving present time

      if (currentTime - lastMessageTime >= 1000) {
        var yrh = results.poseLandmarks[24].y;
        var yrk = results.poseLandmarks[26].y;
        var yra = results.poseLandmarks[28].y;

        var ylh = results.poseLandmarks[23].y;
        var ylk = results.poseLandmarks[25].y;
        var yla = results.poseLandmarks[27].y;

        if (yla - ylk > ylk - ylh || yra - yrk > yrk - yrh) {
          mpState["move"] = true;
          sendMessageToUnity("MoveForward");
          lastMessageTime = currentTime;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}


function Punch() {
  try {
    if (results.poseLandmarks) {
      var currentTime = Date.now(); // saving present time

      if (currentTime - lastMessageTime >= 1000) {

        var xls = results.poseLandmarks[11].x;

        var xrs = results.poseLandmarks[12].x;
        var yrs = results.poseLandmarks[12].y;

        var xrw = results.poseLandmarks[16].x;
        var yrw = results.poseLandmarks[16].y;

        if (xrs + xrs * 0.1 > xrw && xrs - xrs * 0.1 < xrw) {
          if (
            yrs + yrs * 0.1 > yrw &&
            yrs - yrs * 0.1 < yrw &&
            mpState["punch"] == false
          ) {
            mpState["punch"] = true;
            sendMessageToUnity("PlayerPunch");
            console.log("Punch");
            lastMessageTime = currentTime;
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}