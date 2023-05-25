turnConfig = {
  iceServers: 
	[
		{
			urls: [
				"stun:stun.l.google.com:19302",
				"stun:stun1.l.google.com:1930",
				"stun:stun2.l.google.com:1930",
				"stun:stun3.l.google.com:1930",
				"stun:stun4.l.google.com:1930"
			]
			//urls: ["stun:sp-turn1.xirsys.com"]
		}
		// ,
		// {
		// 	username: "s5P6DIjTc-WT8yzdRnu9fGkosqm6Dc7vs4a8q5Eb1vlA7abxIy9ezNzfzB3E6tCYAAAAAGRt-oB3ZXNsbGV5dmM=",
		// 	credential: "7767ef46-fa29-11ed-9b4d-0242ac120004",
		// 	urls:[
		// 		"turn:sp-turn1.xirsys.com:80?transport=udp",
		// 		"turn:sp-turn1.xirsys.com:3478?transport=udp",
		// 		"turn:sp-turn1.xirsys.com:80?transport=tcp",
		// 		"turn:sp-turn1.xirsys.com:3478?transport=tcp",
		// 		"turns:sp-turn1.xirsys.com:443?transport=tcp",
		// 		"turns:sp-turn1.xirsys.com:5349?transport=tcp"
		// 	]
		// }
	]
}