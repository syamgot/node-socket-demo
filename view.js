
(function(){



var Chara;
Chara = (function(){

	function Chara(context){

		this.imgTbl = [
			  'hiyoco_nomal_full.png'
			, 'hiyoco_lady_full.png'
			, 'hiyoco_mecha_full.png' 
			, 'hiyoco_waru_full.png' 
		];

		this.spriteTbl = [
			  [[32,64],[0,64],[32,64],[64,64]] // l
			, [[128,32],[96,32],[128,32],[160,32]] // u
			, [[128,64],[96,64],[128,64],[160,64]] // r
			, [[32,32],[0,32],[32,32],[64,32]] // d
		];
		this.img;
		this.ready 		= false;
		this.context 	= context;

		this.imgIdx 	= Math.floor(Math.random()*(3-0)+0);
		
		this.direction = 3; // 0:l 1:u 2:r 3:d

		this.spriteIdx = 0;

		this.dx = 0;
		this.dy = 0;

		this.id = -1;

		this.moving = false;

	}

	Chara.prototype.init = function() {
		this.img = new Image();
		this.img.src = this.imgTbl[this.imgIdx];
		this.dx = Math.floor(Math.random()*(200-10)+10);
		this.dy = Math.floor(Math.random()*(300-10)+10);
		this.img.onload = (function (self) {
            return function () {
				self.ready = true;
            };
        })(this);
		return this;
	};

	Chara.prototype.input = function(dx, dy, direction) {
		this.dx = dx;
		this.dy = dy;
		this.direction = direction;
	};

	Chara.prototype.keyInput = function(keyBuffer) {
		this.moving = true;
		if (keyBuffer[37]) {
			this.direction = 0;
			this.dx -= 4;
		} 
		else if (keyBuffer[38]) {
			this.direction = 1;
			this.dy -= 4;
		}
		else if (keyBuffer[39]) {
			this.direction = 2;
			this.dx += 4;
		}
		else if (keyBuffer[40]) {
			this.direction = 3;
			this.dy += 4;
		}
		else {
			this.moving = false;
		}
	};

	Chara.prototype.draw = function() {
		if (this.ready && this.id > 0) {

			//
			if (this.moving) {
				this.incIndex();
			}
			else {
				this.spriteIdx = 0;
			}

			//
			var pos = this.spriteTbl[this.direction][this.spriteIdx];
			var sx = pos[0]; var sy = pos[1];
			this.context.drawImage(this.img, sx, sy, 32, 32, this.dx, this.dy, 32, 32);
			this.context.fillText(this.id, this.dx, this.dy, 200);
		}
	};

	Chara.prototype.incIndex = function() {
		var len = this.spriteTbl[this.direction].length;
		this.spriteIdx++;
		if (this.spriteIdx >= len) {
			this.spriteIdx = 0;
		}
		return this;
	};

	Chara.prototype.getContext = function() {
		return {
			  id:this.id
			, dx:this.dx
			, dy:this.dy
			, direction:this.direction
			, moving:this.moving
			, imgIdx:this.imgIdx
		};
	};

	Chara.prototype.setContext = function(ctx) {
		this.id = ctx.id;
		this.dx = ctx.dx;
		this.dy = ctx.dy;
		this.direction = ctx.direction;
		this.moving = ctx.moving;
		this.imgIdx = ctx.imgIdx;
		return this;
	};

	return Chara;
})();


window.onload = function() {

	// ----------------------------------------
	// key events
	//
	var keyBuffer = [];
	document.onkeydown = function (e){
		keyBuffer[e.keyCode] = true;
	};
	document.onkeyup = function (e){
		keyBuffer[e.keyCode] = false;
	};
	window.onblur = function (){
		keyBuffer = [];
	};

	// ----------------------------------------
	// canvas setup
	//
	var cvs = document.getElementById('canvas');
	var ctx = cvs.getContext("2d");
	var cvs2 = document.getElementById('prerender');
	var ctx2 = cvs2.getContext("2d");

	// ----------------------------------------
	// character
	//
	var chara = new Chara(ctx2, "hiyoco_nomal_full.png").init();
	var charas = {};

	// ----------------------------------------
	// frame event handler
	//
	function onFrame() {

		// clear image
		ctx2.clearRect(0,0,cvs2.width, cvs2.height);

		// my character
		chara.keyInput(keyBuffer);
		sendPos(chara.getContext());
		chara.draw();

		// other characters
		for (var id in charas) {
			charas[id].draw();
		}

		// draw image
		var imgdata = ctx2.getImageData(0,0,cvs2.width, cvs2.height);
		ctx.putImageData(imgdata,  0, 0);

	}


	// ----------------------------------------
	// socket 
	//	

	var s = io.connect('http://localhost:3000');

	//サーバから受け取るイベント
	s.on("connect", function () {});
	s.on("disconnect", function (client) {});

	// 
	function reqId() {
		s.emit('C2SreqId');
	}
	s.on('S2Cwelcome', function(data){
		chara.id = data.id;
	})
	s.on('S2Cbye', function(data){
		delete charas[data.id];
	})

	// メッセージ
	function sendMsg(id, msg) {
		s.emit('C2SsendMsg', {id:id, msg:msg});
	}
	s.on('S2CsendMsg', function(data) {
		addLog(data.id+':'+data.msg);
	});
	document.getElementById('sendMsg').addEventListener('click', function(){
		var msg = document.getElementById('msg').value;
		sendMsg(chara.id,msg);
	});

	// キャラコンテキスト
	function sendPos(ctx) {
		s.emit('C2SsendPos', ctx);
	}
	s.on('S2CsendPos', function(data){
		if (charas[data.id] == undefined) {
			charas[data.id] = new Chara(ctx2).setContext(data).init();
		}
		else {
			charas[data.id].setContext(data);
		}
	});

	//
	function addLog(msg) {
		var elm = document.getElementById('log');		
		elm.innerHTML = msg+'<br />'+elm.innerHTML;
	}

	// ----------------------------------------
	// main
	//

	reqId();
	onFrame();
	setInterval(onFrame, 256);


};


})();

