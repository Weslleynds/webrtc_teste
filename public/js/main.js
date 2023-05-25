"use strict";

var client;
var pc;
var pcConfig = turnConfig;

/* PARTE DE VIDEO */
var video = document.createElement("video");
video.controls = true;
video.playsInline = true;
video.preload = "auto";

video.style.display = "block"; // fix bottom margin 4px
video.style.width = "50%";
video.style.height = "50%";

document.getElementById("video_container").appendChild(video);

/** @type {HTMLVideoElement} */
const video2 = document.createElement("video");
video2.addEventListener("loadeddata", (ev) => handlePcvideo(ev), {
  once: true,
});

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

            sendMessageClient({tipo: "fechar", idClient: client.id, entidade: 'u'});

        } else {
            console.log("elseeees");
            pc.close();
            pc = null;

            sendMessageClient({tipo: "fechar", idClient: client.id, entidade: 'u'});
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

/* PARTE DE VIDEO */


/* PARTE LOG */
var l = document.getElementById("l");
var log = function (m) {
  var i = document.createElement("li");
  i.innerText = new Date().toISOString() + " CLIENT " + m;
  l.appendChild(i);
};
var logFrigate = function (m) {
  var i = document.createElement("li");
  i.innerText = new Date().toISOString() + " FRIGATE: " + m;
  l.appendChild(i);
};
/* PARTE LOG */



function iniciar() {
    //client = new WebSocket("ws://192.168.1.47:8080/testews");

    let url = document.getElementById("url").value;

    console.log(url);

    log("opening websocket connection");

    client = new WebSocket(url);

    client.addEventListener("error", function (m) {
      log("error");
    });
    
    client.addEventListener("open", function (m) {
      log("websocket connection open");
      sendMessageClient({tipo: "iniciar"});
    });
    
    client.addEventListener("message", function (m) {
      log(m.data);
      const msg = JSON.parse(m.data);
      console.log(msg);

      client.id = "w";
      
      if (msg.tipo == "id") {
        client.id = msg.dados.msg;
        //sendMessageClient({tipo: "salvar", idClient: client.id, frigate: false});
        // sendMessageClient({tipo: "iniciar", idClient: client.id, entidade: 'u'});
      }
      else if (msg.tipo == "mensagemDoFrigate") {
        switch (msg.dados.msg.type) {
          case "open":
                createPeerConnection();
            break;
          case "webrtc/candidate":
            pc.addIceCandidate({
              candidate: msg.dados.msg.value,
              sdpMid: "0",
            }).catch(() => console.debug);
            break;
          case "webrtc/answer":
            pc.setRemoteDescription({
              type: "answer",
              sdp: msg.dados.msg.value,
            }).catch(() => console.debug);
            break;
          case "error":
            if (msg.dados.msg.value.indexOf("webrtc/offer") < 0)
              console.log("error");
            pc.close();
        }
      }

    });
}

function sendMessageClient(value) {
    client.send(JSON.stringify(value));
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
            sendMessageClient({tipo: "mensagemParaFrigate", idClient: client.id, entidade: 'u', dados: { msg: {type: "webrtc/offer", value: offer.sdp}}});
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
    sendMessageClient({tipo: "mensagemParaFrigate", idClient: client.id, entidade: 'u', dados: { msg: {type: "webrtc/candidate", value: candidate}}});
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
    logFrigate(pc.connectionState);
    console.log(event);

    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      pc.close(); // stop next events
      pc = null;

      iniciar();
    }
  }

  function getUniqueID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
  };