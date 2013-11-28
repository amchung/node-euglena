//  Sample refactored by David Rousset - Microsoft France - http://blogs.msdn.com/davrous 
//  Using Hand.js to support all platforms

//  Based on https://github.com/sebleedelisle/JSTouchController/blob/master/Touches.html 

//  Copyright (c)2010-2011, Seb Lee-Delisle, sebleedelisle.com. All rights reserved.

//  Redistribution and use in source and binary forms, with or without modification, are permitted provided 
//  that the following conditions are met:

//    * Redistributions of source code must retain the above copyright notice, 
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright notice, 
//      this list of conditions and the following disclaimer in the documentation 
//      and/or other materials provided with the distribution.

//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS 
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY 
//  AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR 
//  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, 
//  OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; 
//  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
//  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY 
//  OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 

// shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

var control_canvas,
c,	// c is the fg_canvas' context 2D
halfWidth,
halfHeight,
leftPointerID = -1,
leftPointerPos = new Vector2(0, 0),
leftPointerStartPos = new Vector2(0, 0),
leftVector = new Vector2(0, 0);
arrow = new VectorLED(0, 0, 0, 0);

var touches; // collections of pointers

/////////////////////////////// ARDUINO SETUP 
var IOBoard = BO.IOBoard;
var IOBoardEvent = BO.IOBoardEvent;
var Pin = BO.Pin;

//// Variables
// LED related
var led1; //-90
var led2; //0
var led3; //90
var led4; //180=-180
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
///////////////////////////// ARDUINO SETUP END

var username = "noname";
var socket;

document.addEventListener("DOMContentLoaded", init);
	
window.onorientationchange = resetCanvas;
window.onresize = resetCanvas;

function init() {
    setupCanvas();
    setupVidCanvas();
    setupObjCanvas();
    setupMotionDetection();
    
    touches = new Collection();
    
    arduino.addEventListener(IOBoardEvent.READY, onReady);
}

function onReady(event) {
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
	    
	// jQuery part for the button
    $("#slider").slider({
        step: 0.05,
        min : 0.0,
        max : 1.0
    });

    $('#value').text("Value: 0");
    
    $( "#slider" ).bind( "slide", function(event, ui) {
        var value = ui.value;
        $('#value').text("Value: " + value.toFixed(2));
        brown_const = value;
        console.log(brown_const);
    });
    

	$('input[name=setUsername]').click(function(){
			if($('input[name=usernameTxt]').val() != ""){
				username = $('input[name=usernameTxt]').val();
				var msg = {type:'setUsername', user:username};
				socket.json.send(msg);
			}
			$('#username').slideUp("slow",function(){
				$('#sendChat').slideDown("slow");
				resetGame();
			});
	});
	
	socket = new io.connect('http://171.65.102.132');
	var chat = $('#chat');
	var board = $('#board');

	socket.on('connect', function() {
		console.log("Connected");
		chat.html("<b>Connected!</b>");
	});

	socket.on('message', function(message){
		chat.append(message + '<br />');
	});
		
	socket.on('postscore', function(score){
		board.empty();
		for (var i=0;i<score.length;i++){
			if(i==0){
				board.append('<span style="color: #FA6600">'+ score[i][0]+'  :  '+score[i][1]+'</span> <br />');
			}else{
				board.append(score[i][0]+'  :  '+score[i][1]+ '<br />');
			}
		}
		board.fadeOut('fast');
		board.fadeIn('fast');
		board.fadeOut('fast');
		board.fadeIn('fast');
	});

	socket.on('disconnect', function() {
		console.log('disconnected');
		chat.html("<b>Disconnect!</b>");
	});

	$("input[name=sendBtn]").click(function(){
		var msg = {type:'chat',message:username + " : " + $("input[name=chatTxt]").val()}
		socket.json.send(msg);
		$("input[name=chatTxt]").val("");
	});
	
	control_canvas.addEventListener('pointerdown', onPointerDown, false);
    control_canvas.addEventListener('pointermove', onPointerMove, false);
    control_canvas.addEventListener('pointerup', onPointerUp, false);
    control_canvas.addEventListener('pointerout', onPointerUp, false);
    
    requestAnimFrame(draw);
}

function draw() {
	c.clearRect(0, 0, control_canvas.width, control_canvas.height);
	
    c.beginPath();
    c.moveTo(halfWidth, halfHeight-4);
    c.strokeStyle = "rgba(250, 102, 0, 1)";
    c.lineWidth = 2;
    //c.arc(halfWidth, halfHeight, 40, 0, Math.PI * 2, true);
    c.lineTo(halfWidth, halfHeight+4);
    c.stroke();
            
    c.beginPath();
    c.moveTo(halfWidth+4, halfHeight);
    c.strokeStyle = "rgba(250, 102, 0, 1)";
    c.lineWidth = 2;
    //c.arc(halfWidth, halfHeight, 40, 0, Math.PI * 2, true);
    c.lineTo(halfWidth-4, halfHeight);
    c.stroke();
    
    drawCircles(halfWidth, halfHeight);
    
	//// mouse event loop
    touches.forEach(function (touch) {
        if (touch.identifier == leftPointerID) {
            var alpha = arrow.trimArrow(leftVector, max_val);
            
            c.beginPath();
            c.fillStyle = "rgba(250, 102, 0, 1)";
            c.arc(leftPointerPos.x, leftPointerPos.y, 16, 0, Math.PI * 2, true);
            c.fill();
            
            c.beginPath();
            c.moveTo(leftPointerStartPos.x,leftPointerStartPos.y);
            c.strokeStyle = "rgba(250, 102, 0, 1)";
			c.lineTo(leftPointerStartPos.x+max_val*(arrow.int2-arrow.int4),leftPointerStartPos.y+max_val*(arrow.int1-arrow.int3));
			c.lineWidth = 3;
			c.stroke();
			
			c.beginPath();
			c.fillStyle = "rgba(255, 255, 255, "+alpha*(LEDcont)+")";
    		c.arc(halfWidth, halfHeight, 16, 0, Math.PI * 2, true);
    		c.fill();
			
			c.beginPath();
        	c.fillStyle = "#fff"; 
        	c.fillText(alpha,halfWidth-10, halfHeight-25);
        	
        	c.beginPath();
        	c.fillStyle = "#dd6600";
        	var theta = leftVector.angle();
        	c.fillText(theta.toFixed(0),leftPointerPos.x+10, leftPointerPos.y-20);
        }
    });

    requestAnimFrame(draw);
    
    //// LED control loop
    var delta = Date.now() - lastUpdateTime;
    if (acDelta > msPerFrame)
    {
        acDelta = 0;
        if(LEDloopON) 
        {
        	//LEDon = frame%2;
        	LEDcont = 1;
        	changeLED(LEDcont);
        }
        frame++;
        if (frame >= 2) {frame = 0;}
    } else
    {
        acDelta += delta;
    }
    lastUpdateTime = Date.now();
}

function drawCircles(xCenter,yCenter)
{
	var needle = new Vector2(max_val, 0);
	for(var i=0;i<24*3;i++)
	{
		c.beginPath();
		c.fillStyle = "rgba(255, 255, 255, 0.5)";
		c.lineWidth = 3;
		c.arc(xCenter + needle.x, yCenter + needle.y, 1, 0, Math.PI * 2, true);
		c.fill();
		needle.rotate(5,0);
	}
}

function givePointerType(event) {
    switch (event.pointerType) {
        case event.POINTER_TYPE_MOUSE:
            return "MOUSE";
            break;
        case event.POINTER_TYPE_PEN:
            return "PEN";
            break;
        case event.POINTER_TYPE_TOUCH:
            return "TOUCH";
            break;
    }
}

function onPointerDown(e) {
    var newPointer = { identifier: e.pointerId, x: e.clientX, y: e.clientY, type: givePointerType(e) };
    leftPointerID = e.pointerId;
    //leftPointerStartPos.reset(e.clientX, e.clientY);
    leftPointerStartPos.reset(halfWidth, halfHeight);
    leftPointerPos.copyFrom(leftPointerStartPos);
    leftVector.reset(0, 0);
    arrow.reset(0, 0, 0, 0);
    touches.add(e.pointerId, newPointer);
}

function onPointerMove(e) {
    if (leftPointerID == e.pointerId) {
        //leftPointerPos.reset(e.clientX, e.clientY);
        leftPointerPos.reset(e.offsetX, e.offsetY);
        leftVector.copyFrom(leftPointerPos);
        //leftVector.minusEq(leftPointerStartPos);
        leftVector.minusEq(leftPointerStartPos);
        arrow.setArrow(leftVector, max_val);
        LEDloopON = true;
    }
    else {
        if (touches.item(e.pointerId)) {
            touches.item(e.pointerId).x = e.clientX;
            touches.item(e.pointerId).y = e.clientY;
        }
    }
}

function onPointerUp(e) {
    if (leftPointerID == e.pointerId) {
        leftPointerID = -1;
        leftVector.reset(0, 0);
    }
    leftVector.reset(0, 0);
    arrow.reset(0, 0, 0, 0);
    touches.remove(e.pointerId);
    LEDloopON = false;
    changeLED(0);
}

function setupCanvas() {
    control_canvas = document.getElementById('controlCanvas');
    c = control_canvas.getContext('2d');
    resetCanvas();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 2;
}

// Arduino control functions
function changeLED(LEDon) {
	if(LEDon)
	{
		led1.value = arrow.int1;
    	led2.value = arrow.int2;
    	led3.value = arrow.int3;
    	led4.value = arrow.int4;
    }
    else
    {
    	led1.value = 0;
    	led2.value = 0;
    	led3.value = 0;
    	led4.value = 0;
	}
}


function resetCanvas(e) {
    max_val = (document.getElementById("controlArea").offsetWidth-60)/2;
    
    // resize the canvas - but remember - this clears the canvas too.
    
    control_canvas.width = max_val*2;
    control_canvas.height = max_val*2;

    halfWidth = control_canvas.width/2;
    halfHeight = control_canvas.height/2;

    // make sure we scroll to the top left. 
    window.scrollTo(0, 0);
}