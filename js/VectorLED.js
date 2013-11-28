
var VectorLED = function (int1,int2,int3,int4) {
	
	this.int1 = int1 || 0;
	this.int2 = int2 || 0;
	this.int3 = int3 || 0;
	this.int4 = int4 || 0;
	
};



VectorLED.prototype = {

	reset: function (int1,int2,int3,int4) {

		this.int1 = int1;
		this.int2 = int2;
		this.int3 = int3;
		this.int4 = int4;

		return this;

	},
	
	trimArrow: function (vect, max_val){
	
		var magn = vect.magnitude();

		magn=magn/max_val; 
		magn=magn.toFixed(2); 
		
		//magn=Math.sqrt(magn);
		//magn=magn/14;
		//magn=magn.toFixed(2);
		
		if (magn>1){
			magn=1;
		}
		if (magn<0){
			magn=0;
		}
		
		return magn;
	
	},
	
	setArrow: function (vector, max_val){
	
		var led1=0;
		var led2=0;
		var led3=0;
		var led4=0;
	
		var m = this.trimArrow(vector, max_val);
		var vect = vector.clone();
		vect.normalise();
		
		if (vect.x>0.03){
			led2 = m * vect.x;
			led2 = led2.toFixed(2);
		}
		
		if (vect.x<-0.03){
			led4 = m * vect.x;
			led4 = led4.toFixed(2);
			led4 = -led4;
		}
		
		if (vect.y>0.03){
			led1 = m * vect.y;
			led1 = led1.toFixed(2);
		}
		
		if (vect.y<-0.03){
			led3 = m * vect.y;
			led3 = led3.toFixed(2);
			led3 = -led3;
		}

		this.int1 = led1;
		this.int2 = led2;
		this.int3 = led3;
		this.int4 = led4;
		
		return this;
		
	}
	
};