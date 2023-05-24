const WebSocket = require("ws");

var log = function (m) {
	console.log(new Date().toISOString() + " CLIENT " + m);
};
var logFrigate = function (m) {
	console.log(new Date().toISOString() + " FRIGATE " + m);
};

var clientFrigate;
var client = new WebSocket("ws://192.168.1.47:8080/testews");

client.addEventListener("error", function (m) {
	log("error");
});

client.addEventListener("open", function (m) {
	log("websocket connection open");
});

client.addEventListener("onClose", function (m) {
	console.log(m.data);
});

client.addEventListener("message", function (m) {
	console.log(m);
	const msg = JSON.parse(m.data);
	console.log(msg);

	if (msg.tipo == "iniciar") {
		iniciaVideo();
	}
	else if (msg.tipo == "fechar") {
		if (clientFrigate != null) {
			clientFrigate.close();
		}
	}
	else if (msg.tipo == "mensagemParaFrigate") {
		sendMessageFrigate(msg.dados.msg);
	}
});

function sendMessageClient(value) {
	client.send(JSON.stringify(value));
}

function sendMessageFrigate(value) {
	clientFrigate.send(JSON.stringify(value));
}





function iniciaVideo() {
	clientFrigate = new WebSocket("ws://192.168.1.37:1984/api/ws?src=camera_1");
	clientFrigate.binaryType = "arraybuffer";

	clientFrigate.addEventListener("error", function (m) {
		logFrigate("error");
	});

	clientFrigate.addEventListener("open", function (m) {
		logFrigate("websocket connection open");

		sendMessageClient({tipo: "mensagemDoFrigate", dados: { msg: {type: "open"}}});
	});

	clientFrigate.addEventListener("message", function (m) {
		logFrigate(m.data);
		const msg = JSON.parse(m.data);

		if (["webrtc/candidate", "webrtc/answer", "error"].includes(msg.type)) {
			sendMessageClient({tipo: "mensagemDoFrigate", dados: { msg: msg}});
		}
	});

	clientFrigate.addEventListener("close", function (m) {
		console.log(m);
		logFrigate("Close");
	});
}