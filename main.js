// ==UserScript==
// @name        keyanTestScript
// @namespace   thakali.com
// @include     https://www.facebook.com/*
// @version     1
// @grant       none
// ==/UserScript==

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
		window.BL.setUpPageElements();
		window.BL.getLoadedImgTag();		
	}
}

window.BL = new function(){

	var self= this;
	var status = {
		noTagging : 0,
		doneTagging :1
	};

	var state = status.noTagging;

	self.fuckingStartEverything = function(){

		window.BL.getLoadedImgTag();
		window.BL.setUpInputElement();
		window.BL.setUpPageElements();	

		//window.fbUtil.startCustomTags();
			
	};

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
	};

	self.setUpPageElements = function(){
		var x=document.createElement("a");
		x.innerHTML = "Earn by tagging a Business or Brand";
		x.href = "#";
		x.id="Initiator";
		x.onclick = function(){
			
			if(state == status.noTagging){
				//setUpInputElement();
				window.fbUtil.startCustomTags();
				x.innerHTML = "Done Tagging";					
			}else{
				//window.fbUtil.tearDownOverlay();
				x.innerHTML = "Earn by taggin a Business or brand";
			}
			state = state == 1? 0:1			
		};
		
		$('#fbPhotoSnowliftCaption').append(x);		
	};

	self.setUpInputElement = function(){

		//handle creation and deletion
		var st = "<div id='inputPannel'>"
				 + "<input type='text' width='100px' id='brand' placeholder='Business/Brand'>"
				 + "<span id='clear'>✘</span>"
				 + "</br>"
				 + "<select id='category' width='100px'>"
				 	+ "<option value='0'>Brand</option>"
				 	+ "<option value='1'>Travel</option>"
				 	+ "<option value='2'>Hotel</option>"
				 	+ "<option value='3'>Restaurant/Hangouts</option>"
				 	+ "</select>"
				 + "<span id='persist'>✔</span>"
				+ "</div>";
		
		$('body').append(st);
		$('#inputPannel').hide();
		$('#inputPannel').css("position","fixed");
		$('#inputPannel').css("z-index","10000000");
		$('#inputPannel').on("click",function(evt){
			evt.stopPropagation();
		});

		$("#clear").on("click",function(){
			$("#brand").val("");
			$("#inputPannel").hide();		
		});

		$("#persist").on("click",function(){
			
			if(!window.tuple){
				console.error("window tuple not set");
				return;
			}
			window.tuple.brand = $("#brand").val();
			window.tuple.category = $("#category").val();
			
			window.fbUtil.pushTuple(window.tuple);

			$("#brand").val("");
			$("#inputPannel").hide();			
		});
		

		var inputPannel = $("#inputPannel");
		inputPannel.css("top")
		inputPannel.show();
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
	var imageId;


	self.pushTuple = function(tuple){
		tuplesArray.push(tuple);
	};

	self.startCustomTags = function(){

		// construct a transparent div and stop propagation to lower layer. 
		// destruct the div after user is done tagging
		// do a cleanUp
		clearHoverCardData();

		var layover = document.createElement("div");
		imgBox= $(".spotlight")[0];
		
		if(!imgBox){
			console.error("spotlight div not found!");
			return;			
		}
		
		imageId = window.BL.getLoadedImgTag();

		imgBox = imgBox.getBoundingClientRect();
		layover.id="customLayover";
		layover.style.height = imgBox.height + "px";
		layover.style.width = imgBox.width + "px";
		layover.style.position = "fixed";
		layover.style.top = imgBox.top + "px";
		layover.style.left = imgBox.left + "px";	
		layover.style.zIndex = 10000000;	

		$(".spotlight")[0].parentNode.appendChild(layover);

		wireUpOverlayDiv();
	};

	var wireUpOverlayDiv = function(){

		//attach click listeners and stop click propagation
		var offsetX,offsetY;

		$('#customLayover').on("click",function(evt){
			console.log(evt);
			evt.stopPropagation();
			if(evt.offsetX && evt.offsetY){
				offsetX = evt.offsetX;
				offsetY = evt.offsetY;
			}else if(evt.clientX && evt.clientY){
				offsetX = evt.clientX - imgBox.left;
				offsetY = evt.clientY - imgBox.top;
			}else{
				//error offsetX is not set in click event!
				console.error("click event not set properly");
				console.error(evt);
				return;
			}	

			tuple = {
				x : (offsetX * 100)/imgBox.width,
				y : (offsetY * 100)/imgBox.height,				
			};

			readUserInput(tuple);		
		});
	};

	self.tearDownOverlay = function(){
		//persist tuplesArray
		window.DB.write(imageId,tuplesArray);
		console.log(tuplesArray);	
		tuplesArray = [];	
		$("#customLayover").remove();
	}

	self.showCustomTags = function(){
		if(tuplesArray.length == 0){
			tuplesArray = JSON.parse(window.DB.read(imageId));
			console.log("read from local localStorage");
			console.log(tuplesArray);
		}else{
			console.log("read from local localStorage");
		}
		applyTags();
	};

	var applyTags = function(){
		tuplesArray.forEach(function(val,idx){
			renderHoverCard(relativePosition(val.x,val.y),
				idx,
				val.brand,
				null);
		});
	};

	var relativePosition = function(x,y){
		return {
			left : imgBox.left + ( (x*imgBox.width)/100 ),
			top : imgBox.top + ( (y*imgBox.height)/100 )
		}
	};

	var renderHoverCard = function(pos,id,text,callBack){
		var card = createHoverCard(pos,id,text);
		card.onclick = callBack;
		document.body.appendChild(card);
		$(card).fadeOut(2000,function(){
			$(this).css("opacity","0.2");
			$(this).show();
			$(this).on("mouseenter",function(){
				$(this).css("opacity","0.8");
			});
			$(this).on("mouseleave",function(){
				$(this).css("opacity","0.2");
			});
		});
	};

	var createHoverCard = function(pos,id,text){
		var tmp = document.createElement("div");
		tmp.innerHTML = text;
		tmp.id="hoverCard"+id;
		tmp.class="customHoverCard";

		tmp.style.position = "fixed";
		tmp.style.top = pos.top + "px";
		tmp.style.left = pos.left + "px";
		tmp.style.backgroundColor="white";
		tmp.style.boxShadow = "0 0 0.2em 0.2em";
		tmp.style.padding = "0.2em";
		tmp.style.zIndex=1000000;		
		return tmp;
	};

	var clearHoverCardData = function(){
		tuplesArray = [];
		$('.customHoverCard').remove();
	};

	var readUserInput = function(tuple){
		
		window.tuple = tuple;
		var relPos = relativePosition(tuple.x, tuple.y);
		$('#inputPannel').css("top",relPos.top);
		$('#inputPannel').css("left",relPos.left);		
	}
}
