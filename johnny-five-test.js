var five = require("johnny-five"),
board = new five.Board();
 
board.on("ready", function() {

// Create an Led on pin 13 and strobe it on/off
// Optionall set the speed; defaults to 100ms
//(new five.Led(13)).strobe();
 
this.pinMode(10, five.Pin.PWM);

for (var i=0;i<255;i++){
	this.analogWrite(10,255-i);
}

this.analogWrite(10,0)
});
/*
/////////////////////////////// ARDUINO SETUP 
var IOBoard = BO.IOBoard;
var IOBoardEvent = BO.IOBoardEvent;
var Pin = BO.Pin;

//// Variables
// LED related
var led1; //-90 D
var led2; //0 R
var led3; //90 U
var led4; //180=-180 L
var LEDloopON = false;
var LEDcont = 1;
var max_val;

var frame = 0;
var lastUpdateTime = 0;
var acDelta = 0;
var msPerFrame = 10;

// Set to true to print debug messages to console
BO.enableDebugging = true; 

var host = window.location.hostname;
// if the file is opened locally, set the host to "localhost"
if (window.location.protocol.indexOf("file:") === 0) {
        host = "171.65.102.132";
    }
var arduino = new IOBoard(host, 8887);
       // Remove the event listener because it is no longer needed
        arduino.removeEventListener(IOBoardEvent.READY, onReady);

        // Set Pin 5,6,9,10 to PWM
        arduino.setDigitalPinMode(5, Pin.PWM);
        arduino.setDigitalPinMode(6, Pin.PWM);
        arduino.setDigitalPinMode(9, Pin.PWM);
        arduino.setDigitalPinMode(10, Pin.PWM);

        // Create an LED object to interface with the LED wired
        // to the I/O board
        led1 = arduino.getDigitalPin(5);
        led2 = arduino.getDigitalPin(6);
        led3 = arduino.getDigitalPin(9);
        led4 = arduino.getDigitalPin(10);
///////////////////////////// ARDUINO SETUP END
*/
