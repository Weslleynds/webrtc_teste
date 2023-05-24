"use strict";

//Defining some global utility variables
// var isChannelReady = false;
// var isInitiator = false;
// var isStarted = false;
// var localStream;
var pc;
// var remoteStream;
// var turnReady;

//Initialize turn/stun server here
//turnconfig will be defined in public/js/config.js
var pcConfig = turnConfig;
// var video = document.getElementById("remoteVideo");
// console.log(video);

var video = document.createElement("video");
video.controls = true;
video.playsInline = true;
video.preload = "auto";

video.style.display = "block"; // fix bottom margin 4px
video.style.width = "50%";
video.style.height = "50%"

document.getElementById("video_container").appendChild(video);

var l = document.getElementById('l');
var log = function (m) {
  var i = document.createElement('li');
  i.innerText = new Date().toISOString()+' CLIENT '+m;
  l.appendChild(i);
}
var logFrigate = function (m) {
    var i = document.createElement('li');
    i.innerText = new Date().toISOString()+' FRIGATE: '+m;
    l.appendChild(i);
}
log('opening websocket connection');

/** @type {HTMLVideoElement} */
const video2 = document.createElement("video");
video2.addEventListener("loadeddata", ev => handlePcvideo(ev), 
{once: true});

var client = new WebSocket('ws://localhost:8080/testews');
client.addEventListener('error', function (m) { log("error"); });
client.addEventListener('open', function (m) { log("websocket connection open"); });
client.addEventListener('message', function (m) { log(m.data); });



var clientFrigate = new WebSocket('ws://192.168.1.37:1984/api/ws?src=camera_1');

clientFrigate.binaryType = "arraybuffer";
//clientFrigate.addEventListener("open", ev => this.onopen(ev));
//clientFrigate.addEventListener("close", ev => this.onclose(ev));


clientFrigate.addEventListener('error', function (m) { 
  logFrigate("error"); 
});

clientFrigate.addEventListener('open', function (m) { 
  logFrigate("websocket connection open"); 
  createPeerConnection();
});

clientFrigate.addEventListener('message', function (m) {
  logFrigate(m.data); 

  const msg = JSON.parse(m.data);

    switch (msg.type) {
        case "webrtc/candidate":
            pc.addIceCandidate({
                candidate: msg.value,
                sdpMid: "0"
            }).catch(() => console.debug);
            break;
        case "webrtc/answer":
            pc.setRemoteDescription({
                type: "answer",
                sdp: msg.value
            }).catch(() => console.debug);
            break;
        case "error":
            if (msg.value.indexOf("webrtc/offer") < 0) 
            console.log("error");
            pc.close();
    }
});

clientFrigate.addEventListener('close', function (m) { 
  console.log(m);
  logFrigate("Close"); 
});

function sendMessageFrigate(value) {
  console.log(value);
  console.log(JSON.stringify(value));
  clientFrigate.send(JSON.stringify(value));
}


function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleTrack;
    pc.onconnectionstatechange = handleConnectionstatechange;

    // Safari doesn't support "offerToReceiveVideo"
    pc.addTransceiver("video", {direction: "recvonly"});
    pc.addTransceiver("audio", {direction: "recvonly"});

    pc.createOffer().then(offer => {
        pc.setLocalDescription(offer).then(() => {
          sendMessageFrigate({type: "webrtc/offer", value: offer.sdp});
        });
    });

    logFrigate("Created RTCPeerConnnection");
  } catch (e) {
    logFrigate("Failed to create PeerConnection, exception: " + e.message);
    alert("Cannot create RTCPeerConnection object.");
    return;
  }
}

function handleIceCandidate(event) {
  logFrigate("icecandidate event: ", event);

  const candidate = event.candidate ? event.candidate.toJSON().candidate : "";
  sendMessageFrigate({type: "webrtc/candidate", value: candidate});

  // if (event.candidate) {
  //   sendMessage(
  //     {
  //       type: "candidate",
  //       label: event.candidate.sdpMLineIndex,
  //       id: event.candidate.sdpMid,
  //       candidate: event.candidate.candidate,
  //     },
  //     room
  //   );
  // } else {
  //   console.log("End of candidates.");
  // }

}

function handleTrack(event) {
    logFrigate("track");
    logFrigate(event);

    // when stream already init
    if (video2.srcObject !== null) return;

    // when audio track not exist in Chrome
    if (event.streams.length === 0) return;

    // when audio track not exist in Firefox
    if (event.streams[0].id[0] === '{') return;

    logFrigate(event.streams[0]);

    video2.srcObject = event.streams[0];

    logFrigate("FIM TRACK");
}

function handleConnectionstatechange(event) {
  logFrigate("handleConnectionstatechange");
  logFrigate(event);
  logFrigate(pc.connectionState);
}

function handlePcvideo(event) {

  console.log("evento");
  console.log(event);
  
  if (!pc) return;

  /** @type {HTMLVideoElement} */
  const video2 = event.target;
  const state = pc.connectionState;

  console.log("video2" + video2);
  console.log("state" + state);

  // Firefox doesn't support pc.connectionState
  // if (state === "connected" || state === "connecting" || !state) {
  //     // Video+Audio > Video, H265 > H264, Video > Audio, WebRTC > MSE
  //     
      let rtcPriority = 0, msePriority = 0;

      /** @type {MediaStream} */
      const ms = video2.srcObject;


      console.log("ms" + ms);
      console.log(ms);
      console.log("FIM ms" + ms);

      if (ms.getVideoTracks().length > 0) rtcPriority += 0x220;
      if (ms.getAudioTracks().length > 0) rtcPriority += 0x102;

      // if (this.mseCodecs.indexOf("hvc1.") >= 0) msePriority += 0x230;
      // if (this.mseCodecs.indexOf("avc1.") >= 0) msePriority += 0x210;
      // if (this.mseCodecs.indexOf("mp4a.") >= 0) msePriority += 0x101;

      if (rtcPriority >= msePriority) {
          console.log("aquiiiii");
          video.srcObject = ms;
          play();

          // this.pcState = WebSocket.OPEN;

          // this.wsState = WebSocket.CLOSED;
          clientFrigate.close();
          clientFrigate = null;
      } else {
          console.log("elseeees");
          // this.pcState = WebSocket.CLOSED;
          pc.close();
          pc = null;
      }
}

function play() {
  video.play().catch(er => {
      if (er.name === "NotAllowedError" && !video.muted) {
          video.muted = true;
          video.play().catch(() => console.debug);
      }
  });
}








// //Defining socket events

// //Event - Client has created the room i.e. is the first member of the room
// socket.on("created", function (room) {
//   console.log("Created room " + room);
//   isInitiator = true;
// });

// //Event - Room is full
// socket.on("full", function (room) {
//   console.log("Room " + room + " is full");
// });

// //Event - Another client tries to join room
// socket.on("join", function (room) {
//   console.log("Another peer made a request to join room " + room);
//   console.log("This peer is the initiator of room " + room + "!");
//   isChannelReady = true;
// });

// //Event - Client has joined the room
// socket.on("joined", function (room) {
//   console.log("joined: " + room);
//   isChannelReady = true;
// });

// //Event - server asks to log a message
// socket.on("log", function (array) {
//   console.log.apply(console, array);
// });

// //Event - for sending meta for establishing a direct connection using WebRTC
// //The Driver code
// socket.on("message", function (message, room) {
//   console.log("Client received message:", message, room);
//   if (message === "got user media") {
//     maybeStart();
//   } else if (message.type === "offer") {
//     if (!isInitiator && !isStarted) {
//       maybeStart();
//     }
//     pc.setRemoteDescription(new RTCSessionDescription(message));
//     doAnswer();
//   } else if (message.type === "answer" && isStarted) {
//     pc.setRemoteDescription(new RTCSessionDescription(message));
//   } else if (message.type === "candidate" && isStarted) {
//     var candidate = new RTCIceCandidate({
//       sdpMLineIndex: message.label,
//       candidate: message.candidate,
//     });
//     pc.addIceCandidate(candidate);
//   } else if (message === "bye" && isStarted) {
//     handleRemoteHangup();
//   }
// });

// //Function to send message in a room
// function sendMessage(message, room) {
//   console.log("Client sending message: ", message, room);
//   socket.emit("message", message, room);
// }

// //Displaying Local Stream and Remote Stream on webpage
// var localVideo = document.querySelector("#localVideo");
// var remoteVideo = document.querySelector("#remoteVideo");
// console.log("Going to find Local media");

// let a =
//   navigator.getUserMedia ||
//   navigator.webkitGetUserMedia ||
//   navigator.mozGetUserMedia ||
//   navigator.msGetUserMedia;

// console.log(navigator.webkitGetUserMedia);
// console.log(navigator.mozGetUserMedia);
// console.log(navigator.msGetUserMedia);

// console.log(localStreamConstraints);

// localStreamConstraints = {
//   video: {
//     facingMode: "user",
//   },
// };

// navigator.mediaDevices
//   .getUserMedia(localStreamConstraints)
//   .then(gotStream)
//   .catch(function (e) {
//     console.log(localStreamConstraints);
//     console.log(gotStream);
//     console.log(e);
//     alert("getUserMedia() error: " + e.name);
//   });

// //If found local stream
// function gotStream(stream) {
//   console.log("Adding local stream.");
//   localStream = stream;
//   localVideo.srcObject = stream;
//   sendMessage("got user media", room);
//   if (isInitiator) {
//     maybeStart();
//   }
// }

// console.log("Getting user media with constraints", localStreamConstraints);

// //If initiator, create the peer connection
// function maybeStart() {
//   console.log(">>>>>>> maybeStart() ", isStarted, localStream, isChannelReady);

//   if (!isStarted && typeof localStream !== "undefined" && isChannelReady) {
//     console.log(">>>>>> creating peer connection");
//     createPeerConnection();
//     pc.addStream(localStream);
//     isStarted = true;

//     console.log("isInitiator", isInitiator);

//     if (isInitiator) {
//       doCall();
//     }
    
//   }

// }

// //Sending bye if user closes the window
// window.onbeforeunload = function () {
//   sendMessage("bye", room);
// };

// //Creating peer connection
// function createPeerConnection() {
//   try {
//     pc = new RTCPeerConnection(pcConfig);
//     pc.onicecandidate = handleIceCandidate;
//     pc.onaddstream = handleRemoteStreamAdded;
//     pc.onremovestream = handleRemoteStreamRemoved;
//     console.log("Created RTCPeerConnnection");
//   } catch (e) {
//     console.log("Failed to create PeerConnection, exception: " + e.message);
//     alert("Cannot create RTCPeerConnection object.");
//     return;
//   }
// }

// //Function to handle Ice candidates generated by the browser
// function handleIceCandidate(event) {
//   console.log("icecandidate event: ", event);
//   if (event.candidate) {
//     sendMessage(
//       {
//         type: "candidate",
//         label: event.candidate.sdpMLineIndex,
//         id: event.candidate.sdpMid,
//         candidate: event.candidate.candidate,
//       },
//       room
//     );
//   } else {
//     console.log("End of candidates.");
//   }
// }

// function handleCreateOfferError(event) {
//   console.log("createOffer() error: ", event);
// }

// //Function to create offer
// function doCall() {
//   console.log("Sending offer to peer");
//   pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
// }

// //Function to create answer for the received offer
// function doAnswer() {
//   console.log("Sending answer to peer.");
//   pc.createAnswer().then(
//     setLocalAndSendMessage,
//     onCreateSessionDescriptionError
//   );
// }

// //Function to set description of local media
// function setLocalAndSendMessage(sessionDescription) {
//   pc.setLocalDescription(sessionDescription);
//   console.log("setLocalAndSendMessage sending message", sessionDescription);
//   sendMessage(sessionDescription, room);
// }

// function onCreateSessionDescriptionError(error) {
//   trace("Failed to create session description: " + error.toString());
// }

// //Function to play remote stream as soon as this client receives it
// function handleRemoteStreamAdded(event) {
//   console.log("Remote stream added.");
//   remoteStream = event.stream;
//   remoteVideo.srcObject = remoteStream;
// }

// function handleRemoteStreamRemoved(event) {
//   console.log("Remote stream removed. Event: ", event);
// }

// function hangup() {
//   console.log("Hanging up.");
//   stop();
//   sendMessage("bye", room);
// }

// function handleRemoteHangup() {
//   console.log("Session terminated.");
//   stop();
//   isInitiator = false;
// }

// function stop() {
//   isStarted = false;
//   pc.close();
//   pc = null;
// }
