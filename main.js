window.jsHelper = new function(){

	var self = this;
	self.LoadJs = function(src){

		try{
			var tmpChild = document.createElement("script");
			tmpChild.type = "text/javascript";
			tmpChild.src = src;
			console.log("attaching child: ");
			console.log(tmpChild);
			var x=document.getElementsByTagName("head")[0];
			x.appendChild(tmpChild);
		}catch(exception){
			console.error("Error: failed loading script "+ src );
			console.error(exception);
		}
	};
};

document.onreadystatechange = function(state){

	var preReqJs = ['http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.1.1.min.js'];
	if(state == "complete"){
		preReqJs.forEach(function(src,idx){
			window.jsHelper.LoadJs(src);
		});		
		window.BL.getLoadedImgTag();
	}
}

window.BL = new function(){

	var self= this;
	self.getLoadedImgTag = function(){
		var cdnKey=$('.spotlight').attr("src");
		var i=cdnKey.lastIndexOf('/');
		var j=cdnKey.indexOf(".png");
		if(j==-1){
			j=cdnKey.indexOf(".jpg");			
		}
		if(i == -1 || j == -1){
			console.error("cdn key inValid. " + cdnKey);
			return;
		}
		cdnKey = cdnKey.substring(i+1,j-2); //hard coded Image id remove resolution and last _[a-z] character
		window.DB.write(cdnKey,"testValue");
		return cdnKey;
		console.log("saving locally" + cdnKey);
	}
};

window.DB = new function(){
	
	var self = this;

	self.write = function(key,value){
		if(key){
			if(window.localStorage.getItem(key) != null){
				console.log("key" + key +" already present. updating to "+value);
			}
			window.localStorage.setItem(key, JSON.stringify(value));
		}
	};

	self.read = function(key){
		return window.localStorage.getItem(key);
	};
};

window.fbUtil = new function(){

	var self = this;
	var imgBox;
	var tuple;
	var tuplesArray = [];

	self.startCustomTags = function(){

		// construct a transparent div and stop propagation to lower layer. 
		// destruct the div after user is done tagging
		var layover = document.createElement("div");
		imgBox= $(".spotlight")[0];
		
		if(!imgBox){
			console.error("spotlight div not found!");
			return;			
		}

		imgBox = imgBox.getBoundingClientRect();
		layover.id="customLayover";
		layover.style.height = imgBox.height + "px";
		layover.style.width = imgBox.width + "px";
		layover.style.position = "fixed";
		layover.style.top = imgBox.top + "px";
		layover.style.left = imgBox.left + "px";		

		$(".spotlight")[0].parentNode.appendChild(layover);

		wireUpOverlayDiv();
	};

	var wireUpOverlayDiv = function(){

		//attach click listeners and stop click propagation
		$('#customLayover').on("click",function(evt){
			console.log(evt);
			evt.stopPropagation();
			if(evt.offsetX && evt.offsetY){
				tuple = {
					x : (evt.offsetX * 100)/imgBox.width,
					y : (evt.offsetY * 100)/imgBox.height,
					cat : ""
				};
				console.log(tuple);
				tuplesArray.push(tuple);
				console.log(tuplesArray);
			}else if(evt.clientX && evt.clientY){
				var offsetX = evt.clientX - imgBox.left;
				var offsetY = evt.clientY - imgBox.top;
				tuple = {
					x : (offsetX * 100)/imgBox.width,
					y : (offsetY * 100)/imgBox.height,
					cat : ""
				};
				console.log(tuple);
				tuplesArray.push(tuple);
				console.log(tuplesArray);
			}else{
				//error offsetX is not set in click event!
				console.error("click event not set properly");
				console.error(evt);
			}
		});
	};

	self.tearDownOverlay = function(){
		//persist tuplesArray
		window.DB.write("tags",tuplesArray);
		console.log(tuplesArray);		
		$("#customLayover").remove();
	}
}
