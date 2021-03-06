var five = require("johnny-five"),
    board = new five.Board(),
    client = require('socket.io-client');

    var socket;
    board.on("ready", function(){
        this.pinMode(5, five.Pin.PWM);
        this.pinMode(6, five.Pin.PWM);
        this.pinMode(9, five.Pin.PWM);
        this.pinMode(10, five.Pin.PWM);
        this.analogWrite(5,0);
        this.analogWrite(6,0);
        this.analogWrite(9,0);
        this.analogWrite(10,0);
	console.log("Arduino ready to use")
    });

    board.on('changeLED', function(arrow){
    	if(arrow.led1==null)arrow.led1=0;
    	if(arrow.led2==null)arrow.led2=0;
    	if(arrow.led3==null)arrow.led3=0;
	if(arrow.led4==null)arrow.led4=0;
    	console.log(arrow)
        this.analogWrite(5,arrow.led1*255);
        this.analogWrite(6,arrow.led2*255);
        this.analogWrite(9,arrow.led3*255);
        this.analogWrite(10,arrow.led4*255);
    });

socket = client.connect('http://171.65.102.132:3002');
socket.on('feedarrow', function (arrow) {
    board.emit('changeLED', arrow);
}); 
