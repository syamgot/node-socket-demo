var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
 
var server = http.createServer(function(req, res) {

	switch (req.url) {
		case '/' : 
		case '/index.html' :
			fs.readFile('./index.html', 'utf-8', function(err, data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.write(data);
				res.end();
			});
			break;
		case '/view.js' :
			fs.readFile('./view.js', 'utf-8', function(err, data){
				res.writeHead(200, {'Content-Type':'application/javascript'});
				res.write(data);
				res.end();
			});
			break;
		case '/hiyoco_nomal_full.png' : 
		case '/hiyoco_lady_full.png' : 
		case '/hiyoco_mecha_full.png' : 
		case '/hiyoco_waru_full.png' : 
			fs.readFile('.'+ req.url, 'binary', function(err, data) {
				res.writeHead(200, {'Content-Type':'image/png'});
				res.write(data, 'binary');
				res.end();
			});
			break;
		default : 
			res.writeHead(404);
			break;
	}

}).listen(process.env.VMC_APP_PORT || 3000);

var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {

	//
	var idTbl = {};
   
	// ID発行
	socket.on('C2SreqId', function(){
		var id = Math.floor(Math.random()*10000);
		idTbl[socket.id] = id;
		socket.broadcast.emit('S2CsendMsg', {id:'srv', msg:'ID'+id+'さん いらっしゃい'});
		io.to(socket.id).emit('S2CsendMsg', {id:'srv', msg:'ID'+id+'さん こんにちは'});
		io.to(socket.id).emit('S2Cwelcome', {id:id});
	});

	// メッセージ
	socket.on('C2SsendMsg', function(data){
		io.sockets.emit('S2CsendMsg', data);
	});

	// 座標を送信
	socket.on('C2SsendPos', function(data){
		socket.broadcast.emit('S2CsendPos', data);
	});
 
	// 切断したときに送信
	socket.on('disconnect', function () {
		var id = idTbl[socket.id];
		if (id != undefined) {
			delete idTbl[socket.id];
			var msg = 'ID'+id+'さん さようなら';
			socket.broadcast.emit('S2CsendMsg', {id:'srv', msg:msg});
			socket.broadcast.emit('S2Cbye', {id:id});
		}
	});

	// io.sockets.emit('info', '全員に送信')　//送信元含む全員に送信
    // io.emit('info', '省略可')　//上と同じ
    // socket.broadcast.emit('info', '送信元以外に送信')　//送信元以外の全員に送信
    // io.to(socket.id).emit('info', '送信元のあなただけ')　//特定のユーザーのみ（socket.idで送信元のみに送信）

});

