
// -----------------------
// --- ENUMS, DEFAULTS ---
// -----------------------

EagleCanvas.LayerId = {
	'BOTTOM_COPPER' : 1,
	'BOTTOM_SILKSCREEN' : 2,
	'BOTTOM_DOCUMENTATION' : 3,
	'DIM_BOARD' : 4,
	'TOP_COPPER' : 5,
	'TOP_SILKSCREEN' : 6,
	'TOP_DOCUMENTATION' : 7,
	'VIAS' : 8,
	'OUTLINE' : 9
}

EagleCanvas.LARGE_NUMBER = 99999;

EagleCanvas.prototype.scale = 25;
EagleCanvas.prototype.minScale = 2.5;
EagleCanvas.prototype.maxScale = 250;
EagleCanvas.prototype.minLineWidth = 0.05;
EagleCanvas.prototype.boardFlipped = false;
EagleCanvas.prototype.dimBoardAlpha = 0.7;

// -------------------
// --- CONSTRUCTOR ---
// -------------------

function EagleCanvas(canvasId) {
	this.canvasId = canvasId;
	
	this.shownLayers = {};
	this.shownLayers[EagleCanvas.LayerId.BOTTOM_COPPER] = true;
	this.shownLayers[EagleCanvas.LayerId.BOTTOM_SILKSCREEN] = true;
	this.shownLayers[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = true;
	this.shownLayers[EagleCanvas.LayerId.DIM_BOARD] = true;
	this.shownLayers[EagleCanvas.LayerId.TOP_COPPER] = true;
	this.shownLayers[EagleCanvas.LayerId.TOP_SILKSCREEN] = true;
	this.shownLayers[EagleCanvas.LayerId.TOP_DOCUMENTATION] = true;
	this.shownLayers[EagleCanvas.LayerId.VIAS] = true;
	this.shownLayers[EagleCanvas.LayerId.OUTLINE] = true;

	this.renderLayerOrder = [];
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_DOCUMENTATION);
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_SILKSCREEN);
	this.renderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_COPPER);
	this.renderLayerOrder.push(EagleCanvas.LayerId.DIM_BOARD);
	this.renderLayerOrder.push(EagleCanvas.LayerId.OUTLINE);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_COPPER);
	this.renderLayerOrder.push(EagleCanvas.LayerId.VIAS);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_SILKSCREEN);
	this.renderLayerOrder.push(EagleCanvas.LayerId.TOP_DOCUMENTATION);

	this.reverseRenderLayerOrder = [];
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_DOCUMENTATION);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_SILKSCREEN);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.TOP_COPPER);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.DIM_BOARD);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.OUTLINE);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_COPPER);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.VIAS);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_SILKSCREEN);
	this.reverseRenderLayerOrder.push(EagleCanvas.LayerId.BOTTOM_DOCUMENTATION);

	this.layerRenderFunctions = {};
	
	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Bottom'],ctx);
		that.drawElements(that.eagleLayersByName['Bottom'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_SILKSCREEN] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['bNames'],ctx);
		that.drawElements(that.eagleLayersByName['bValues'],ctx);
		that.drawElements(that.eagleLayersByName['bPlace'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_DOCUMENTATION] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['bKeepout'],ctx);
		that.drawElements(that.eagleLayersByName['bDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Top'],ctx);
		that.drawElements(that.eagleLayersByName['Top'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_SILKSCREEN] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['tNames'],ctx);
		that.drawElements(that.eagleLayersByName['tValues'],ctx);
		that.drawElements(that.eagleLayersByName['tPlace'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.TOP_DOCUMENTATION] = function(that,ctx) {
		that.drawElements(that.eagleLayersByName['tKeepout'],ctx);
		that.drawElements(that.eagleLayersByName['tDocu'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.DIM_BOARD] = function(that,ctx) {
		that.dimCanvas(ctx,that.dimBoardAlpha);
	}	

	this.layerRenderFunctions[EagleCanvas.LayerId.VIAS] = function(that,ctx) {
		that.drawSignalVias('1-16',ctx, '#0b0');
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.OUTLINE] = function(that,ctx) {
		that.drawPlainWires(that.eagleLayersByName['Dimension'],ctx);
	}

	this.layerRenderFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,ctx) {
		that.drawSignalWires(that.eagleLayersByName['Bottom'],ctx);
		that.drawElements(that.eagleLayersByName['Bottom'],ctx);
	}

	this.hitTestFunctions = {};
	
	this.hitTestFunctions[EagleCanvas.LayerId.BOTTOM_COPPER] = function(that,x,y) {
		return that.hitTestElements(that.eagleLayersByName['Bottom'],x,y)
			|| that.hitTestSignals(that.eagleLayersByName['Bottom'],x,y);
	}

	this.hitTestFunctions[EagleCanvas.LayerId.TOP_COPPER] = function(that,x,y) {
		return that.hitTestElements(that.eagleLayersByName['Top'],x,y)
			|| that.hitTestSignals(that.eagleLayersByName['Top'],x,y);
	}


}


// -------------------------
// --- GENERIC ACCESSORS ---
// -------------------------

/** sets an element id to which the drawing should be initially scaled */
EagleCanvas.prototype.setScaleToFit = function(elementId) {
	this.scaleToFitId = elementId;
}

EagleCanvas.prototype.getScale = function(scale) {
	return this.scale;
}

/** sets the scale factor, triggers resizing and redrawing */
EagleCanvas.prototype.setScale = function(scale) {
	this.scale = scale;
	var canvas = document.getElementById(this.canvasId);
	canvas.width = scale * this.nativeSize[0];
	canvas.height = scale * this.nativeSize[1];
	this.draw();
}


/** Returns whether a given layer is visible or not */
EagleCanvas.prototype.isLayerVisible = function (layerId) {
	return this.shownLayers[layerId] ? true : false;
}

/** Turns a layer on or off */
EagleCanvas.prototype.setLayerVisible = function (layerId, on) {
	if (this.isLayerVisible(layerId) == on) return;
	this.shownLayers[layerId] = on ? true : false;
	this.draw();
}

/** Returns whether the board is flipped (bottom at fromt) or not */
EagleCanvas.prototype.isBoardFlipped = function () {
	return this.boardFlipped;
}

/** Turns top or bottom to the front */
EagleCanvas.prototype.setBoardFlipped = function (flipped) {
	if (this.boardFlipped == flipped) return;
	this.boardFlipped = flipped ? true : false;
	this.draw();
}

EagleCanvas.prototype.setHighlightedItem = function(item) {
	this.highlightedItem = item;
	this.draw();
}

// ---------------
// --- LOADING ---
// ---------------

EagleCanvas.prototype.loadURL = function(url) {
	this.url = url;
	var request = new XMLHttpRequest();
	var that = this;
	request.open('GET', this.url, true);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
        	that.loadText(request.responseText);
	    }
	};
    request.send(null);
};

EagleCanvas.prototype.loadText = function(text) {
	this.text = text;
	var parser = new DOMParser();
	this.document = parser.parseFromString(this.text,"text/xml");
	this.parse();
	this.nativeBounds = this.calculateBounds();
	this.nativeSize = [this.nativeBounds[2]-this.nativeBounds[0],this.nativeBounds[3]-this.nativeBounds[1]];
	this.scaleToFit();
}


// ---------------
// --- PARSING ---
// ---------------

EagleCanvas.prototype.parse = function() {

	this.eagleLayersByName = {};
	this.layersByNumber = {};
	var layers = this.document.getElementsByTagName('layer');
	for (var layerIdx = 0; layerIdx < layers.length; layerIdx++) {
		var layer = layers.item(layerIdx);
		var layerDict = this.parseLayer(layer);
		this.eagleLayersByName[layerDict.name] = layerDict;
		this.layersByNumber[layerDict.number] = layerDict;
	}

	this.elements = {};
	var elements = this.document.getElementsByTagName('element');
	for (var elementIdx = 0; elementIdx < elements.length; elementIdx++) {
		var elem = elements.item(elementIdx);
		var elemDict = this.parseElement(elem);
		this.elements[elemDict.name] = elemDict;
	}

	this.signalItems = {};
	//hashmap signal name -> hashmap layer number -> hashmap 'wires'->wires array, 'vias'->vias array
	var signals = this.document.getElementsByTagName('signal');
	for (var sigIdx = 0; sigIdx < signals.length; sigIdx++) {
		var signal = signals.item(sigIdx);
		var name = signal.getAttribute('name');
		var signalLayers = {};
		this.signalItems[name] = signalLayers;

		var wires = signal.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires.item(wireIdx);
			var wireDict = this.parseWire(wire);
			var layer = wireDict.layer;
			if (!(signalLayers[layer])) signalLayers[layer] = {};
			var layerItems = signalLayers[layer];
			if (!(layerItems['wires'])) layerItems['wires'] = [];
			var layerWires = layerItems['wires'];
			layerWires.push(wireDict);
		}

		var vias = signal.getElementsByTagName('via');
		for (var viaIdx = 0; viaIdx < vias.length; viaIdx++) {
			var via = vias.item(viaIdx);
			var viaDict = this.parseVia(via);
			var layers = viaDict.layers;
			if (!(signalLayers[layers])) signalLayers[layers] = {};
			var layerItems = signalLayers[layers];
			if (!(layerItems['vias'])) layerItems['vias'] = [];
			var layerVias = layerItems['vias'];
			layerVias.push(viaDict);
		}

		var contacts = signal.getElementsByTagName('contactref');
		for (var contactIdx = 0; contactIdx < contacts.length; contactIdx++) {
			var contact = contacts.item(contactIdx);
			var elemName = contact.getAttribute('element');
			var padName = contact.getAttribute('pad');
			var elem = this.elements[elemName];
			if (elem) elem.padSignals[padName] = name;
		}
	}
	
	this.packagesByName = {};
	var packages = this.document.getElementsByTagName('package');
	for (var packageIdx = 0; packageIdx < packages.length; packageIdx++) {
		var package = packages.item(packageIdx);
		var packageName = package.getAttribute('name');

		var packageSmds = [];
		var smds = package.getElementsByTagName('smd');
		for (var smdIdx = 0; smdIdx < smds.length; smdIdx++) {
			var smd = smds[smdIdx];
			packageSmds.push(this.parseSmd(smd));
		}

		var packageWires = [];
		var bbox = [EagleCanvas.LARGE_NUMBER,EagleCanvas.LARGE_NUMBER,-EagleCanvas.LARGE_NUMBER,-EagleCanvas.LARGE_NUMBER];
		var wires = package.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires[wireIdx];
			var wireDict = this.parseWire(wire);
			if (wireDict.x1 < bbox[0]) bbox[0] = wireDict.x1;
			if (wireDict.x1 > bbox[2]) bbox[2] = wireDict.x1;
			if (wireDict.y1 < bbox[1]) bbox[1] = wireDict.y1;
			if (wireDict.y1 > bbox[3]) bbox[3] = wireDict.y1;
			if (wireDict.x2 < bbox[0]) bbox[0] = wireDict.x2;
			if (wireDict.x2 > bbox[2]) bbox[2] = wireDict.x2;
			if (wireDict.y2 < bbox[1]) bbox[1] = wireDict.y2;
			if (wireDict.y2 > bbox[3]) bbox[3] = wireDict.y2;
			packageWires.push(wireDict);
		}
		if ((bbox[0] >= bbox[2]) || (bbox[1] >= bbox[3])) bbox = null;
		var packageTexts = [];
		var texts = package.getElementsByTagName('text');
		for (var textIdx = 0; textIdx < texts.length; textIdx++) {
			var text = texts[textIdx];
			packageTexts.push(this.parseText(text));
		}


		var packageDict = {'smds':packageSmds, 'wires':packageWires, 'texts':packageTexts, 'bbox':bbox};
		this.packagesByName[packageName] = packageDict;
	}

	this.plainWires = {};
	var plains = this.document.getElementsByTagName('plain');	//Usually only one
	for (var plainIdx = 0; plainIdx < plains.length; plainIdx++) {
		var plain = plains.item(plainIdx);
		var wires = plain.getElementsByTagName('wire');
		for (var wireIdx = 0; wireIdx < wires.length; wireIdx++) {
			var wire = wires.item(wireIdx);
			var wireDict = this.parseWire(wire);
			var layer = wireDict.layer;
			if (!this.plainWires[layer]) this.plainWires[layer] = [];
			this.plainWires[layer].push(wireDict);
		}
	}
}

EagleCanvas.prototype.parseSmd = function(smd) {
	var smdX = parseFloat(smd.getAttribute('x'));
	var smdY = parseFloat(smd.getAttribute('y'));
	var smdDX = parseFloat(smd.getAttribute('dx'));
	var smdDY = parseFloat(smd.getAttribute('dy'));
	var smdLayer = smd.getAttribute('layer');
	var smdName = smd.getAttribute('name');
	return {'x1':smdX-0.5*smdDX,'y1':smdY-0.5*smdDY,'x2':smdX+0.5*smdDX,'y2':smdY+0.5*smdDY,'name':smdName,'layer':smdLayer};
}

EagleCanvas.prototype.parseVia = function(via) {
	var x = parseFloat(via.getAttribute('x'));
	var y = parseFloat(via.getAttribute('y'));
	var layers = via.getAttribute('extent');
	var drill = parseFloat(via.getAttribute('drill'));
	return {'x':x, 'y':y, 'drill':drill, 'layers':layers};
}

EagleCanvas.prototype.parseWire = function(wire) {
	var x1 = parseFloat(wire.getAttribute('x1'));
	var y1 = parseFloat(wire.getAttribute('y1'));
	var x2 = parseFloat(wire.getAttribute('x2'));
	var y2 = parseFloat(wire.getAttribute('y2'));
	var layer = parseInt(wire.getAttribute('layer'));
	var width = parseFloat(wire.getAttribute('width'));
	if (width <= 0.0) width = this.minLineWidth;

	return {'x1':x1,'y1':y1,'x2':x2,'y2':y2,'width':width,'layer':layer};
}

EagleCanvas.prototype.parseText = function(text) {
	var x = parseFloat(text.getAttribute('x'));
	var y = parseFloat(text.getAttribute('y'));
	var size = parseFloat(text.getAttribute('size'));
	var layer = parseInt(text.getAttribute('layer'));
	var font = text.getAttribute('font');
	var content = text.textContent;
	if (!content) content = "";
	return {'x':x,'y':y,'size':size,'layer':layer,'font':font,'content':content};
}

EagleCanvas.prototype.parseElement = function(elem) {
	var elemName = elem.getAttribute('name');
	var elemValue = elem.getAttribute('value');
	var elemPackage = elem.getAttribute('package');
	var elemX = parseFloat(elem.getAttribute('x'));
	var elemY = parseFloat(elem.getAttribute('y'));
	var elemRot = elem.getAttribute('rot') || "R0";
	var elemMatrix = this.matrixForRot(elemRot);
	var elemMirror = elemRot.indexOf('M') == 0;
	var elemSmashed = elem.getAttribute('smashed') && (elem.getAttribute('smashed').toUpperCase() == 'YES');
	var attribs = {};
	var elemAttribs = elem.getElementsByTagName('attribute');
	for (var attribIdx = 0; attribIdx < elemAttribs.length; attribIdx++) {
		var elemAttrib = elemAttribs.item(attribIdx);
		var attribDict = {};
		var name = elemAttrib.getAttribute('name');
		if (name) {
			attribDict.name = name;
			if (elemAttrib.getAttribute('x')) attribDict.x = parseFloat(elemAttrib.getAttribute('x'));
			if (elemAttrib.getAttribute('y')) attribDict.y = parseFloat(elemAttrib.getAttribute('y'));
			if (elemAttrib.getAttribute('size')) attribDict.size = parseFloat(elemAttrib.getAttribute('size'));
			if (elemAttrib.getAttribute('layer')) attribDict.layer = parseInt(elemAttrib.getAttribute('layer'));
			attribDict.font = elemAttrib.getAttribute('font');

			var rot = elemAttrib.getAttribute('rot');
			if (!rot) rot = "R0";
			attribDict.rot = rot;
			attribs[name] = attribDict;
		}
	}
	return {
		'package':elemPackage,
		'name':elemName,
		'value':elemValue,
		'x':elemX,
		'y':elemY,
		'rot':elemRot,
		'matrix':elemMatrix,
		'mirror':elemMirror,
		'smashed':elemSmashed,
		'attributes':attribs,
		'padSignals':{}			//to be filled later
	};
};

EagleCanvas.prototype.parseLayer = function(layer) {
	var number = parseInt(layer.getAttribute('number'));
	var name = layer.getAttribute('name');
	var color = parseInt(layer.getAttribute('color'));
	return {'name':name, 'number':number, 'color':color};
}

// ---------------
// --- DRAWING ---
// ---------------

EagleCanvas.prototype.draw = function() {
	var canvas = document.getElementById(this.canvasId);
	var ctx = canvas.getContext('2d');

   	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

   	ctx.save();
	
	ctx.transform(this.scale * (this.boardFlipped ? -1.0 : 1.0), 0, 0, -this.scale, 0, ctx.canvas.height);
	ctx.translate((this.boardFlipped ? -this.nativeBounds[2] : -this.nativeBounds[0]), -this.nativeBounds[1]);
	var layerOrder = (this.boardFlipped) ? this.reverseRenderLayerOrder : this.renderLayerOrder;
	for (var layerKey in layerOrder) {
		var layerId = layerOrder[layerKey];
		if (!this.shownLayers[layerId]) continue;
		this.layerRenderFunctions[layerId](this,ctx);
	}

	ctx.restore();
}

EagleCanvas.prototype.drawPlainWires = function(layer, ctx) {
	if (!layer) return;

	ctx.lineCap = 'round';
	ctx.strokeStyle = this.layerColor(layer.color);

	var layerWires = this.plainWires[layer.number];
	if (!layerWires) return;
	for (var wireIdx in layerWires) {
		var wire = layerWires[wireIdx];
	   	ctx.beginPath();
		ctx.moveTo(wire.x1, wire.y1);
		ctx.lineTo(wire.x2, wire.y2);
		ctx.lineWidth = wire.width;
		ctx.stroke();
	}
}

EagleCanvas.prototype.drawSignalWires = function(layer, ctx) {
	if (!layer) return;
	var layerNumber = layer.number;

	ctx.lineCap = 'round';

	for (var signalKey in this.signalItems) {

		var highlight = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalKey)); 
		var color = highlight ? this.highlightColor(layer.color) : this.layerColor(layer.color);
		ctx.strokeStyle = color;


		var signalLayers = this.signalItems[signalKey];
		var layerItems = signalLayers[layer.number];
		if (!layerItems) continue;
		var layerWires = layerItems['wires'];
		if (!layerWires) continue;
		for (var wireIdx in layerWires) {
			var wire = layerWires[wireIdx];
	    	ctx.beginPath();
			ctx.moveTo(wire.x1, wire.y1);
			ctx.lineTo(wire.x2, wire.y2);
			ctx.lineWidth = wire.width;
			ctx.stroke();
		}
	}
}

EagleCanvas.prototype.drawSignalVias = function(layersName, ctx, color) {
	if (!layersName) return;

	ctx.strokeStyle = color;

	for (var signalKey in this.signalItems) {
		var signalLayers = this.signalItems[signalKey];
		var layerItems = signalLayers[layersName];
		if (!layerItems) continue;
		var layerVias = layerItems['vias'];
		if (!layerVias) continue;
		for (var viaIdx in layerVias) {
			var via = layerVias[viaIdx];
		    ctx.beginPath();
		    ctx.arc(via.x, via.y, 0.75 * via.drill, 0, 2 * Math.PI, false);
			ctx.lineWidth = 0.5 * via.drill;
      		ctx.stroke();
		}
	}
}

EagleCanvas.prototype.drawElements = function(layer, ctx) {
	if (!layer) return;

	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey];
		
		var highlight = (this.highlightedItem && (this.highlightedItem.type=='element') && (this.highlightedItem.name==elem.name)); 
		var color = highlight ? this.highlightColor(layer.color) : this.layerColor(layer.color);

		var package = this.packagesByName[elem.package];
		var rotMat = elem.matrix;

		for (var smdIdx in package.smds) {
			var smd = package.smds[smdIdx];
			var layerNum = smd.layer;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			//Note that rotation might be not axis aligned, so we have do transform all corners
			var x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1;	//top left
			var y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1;
			var x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y1;	//top right
			var y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y1;
			var x3 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2;	//bottom right
			var y3 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2;
			var x4 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y2;	//bottom left
			var y4 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y2;

			var padName = smd.name;
			var signalName = elem.padSignals[padName];
			var highlightPad = (this.highlightedItem && (this.highlightedItem.type=='signal') && (this.highlightedItem.name==signalName)); 

			ctx.fillStyle = highlightPad ? this.highlightColor(layer.color) : color;
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.lineTo(x3,y3);
			ctx.lineTo(x4,y4);
			ctx.closePath();
			ctx.fill();
		}

		for (var wireIdx in package.wires) {
			var wire = package.wires[wireIdx];
			var layerNum = wire.layer;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1;
			var y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1;
			var x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2;
			var y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2;
			ctx.beginPath();
			ctx.lineWidth = wire.width;
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.strokeStyle = color;
			ctx.stroke();
		}

		var smashed = elem.smashed;
		var textCollection = smashed ? elem.attributes : package.texts;	//smashed : use elememt attributes instead of package texts
		for (var textIdx in textCollection) {
			var text = textCollection[textIdx];
			var layerNum = text.layer;
			if ((!elem.smashed) && (elem.mirror)) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;

			var content = smashed ? null : text.content;
			var attribName = smashed ? text.name : ((text.content.indexOf('>') == 0) ? text.content.substring(1) : null);
			if (attribName == "NAME") content = elem.name;
			if (attribName == "VALUE") content = elem.value;
			if (!content) continue;

			var x = smashed ? text.x : (elem.x + rotMat[0]*text.x + rotMat[1]*text.y);
			var y = smashed ? text.y : (elem.y + rotMat[2]*text.x + rotMat[3]*text.y);
			var rot = smashed ? text.rot : elem.rot;
			var size = text.size;

			//rotation from 90.1 to 270 causes Eagle to draw labels 180 degrees rotated with top right anchor point
			var degrees = parseFloat(rot.substring((rot.indexOf('M')==0) ? 2 : 1));
			var flipText = ((degrees > 90) && (degrees <=270));
			var textRot = this.matrixForRot(rot);
			var fontSize = 10;

			ctx.save();
			ctx.fillStyle = color;
			ctx.font = ''+fontSize+'pt vector';	//Use a regular font size - very small sizes seem to mess up spacing / kerning
			ctx.translate(x,y);
			ctx.transform(textRot[0],textRot[2],textRot[1],textRot[3],0,0);
			var scale = size / fontSize;
			ctx.scale(scale,-scale);
			if (flipText) {
				var metrics = ctx.measureText(content);
				ctx.translate(metrics.width,-fontSize);	//Height is not calculated - we'll use the font's 10pt size and hope it fits
				ctx.scale(-1,-1);
			}
			ctx.fillText(content, 0, 0);
			ctx.restore();
		}
	}
}

EagleCanvas.prototype.dimCanvas = function(ctx, alpha) {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = 'rgba(0,0,0,'+alpha+')'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.restore();
};

// -------------------
// --- HIT TESTING ---
// -------------------

EagleCanvas.prototype.hitTest = function(x,y) {
	var canvas = document.getElementById(this.canvasId);
	//Translate screen to model coordinates
	x = x / this.scale;	
	y = (canvas.height - y) / this.scale;
	y += this.nativeBounds[1];
	x = this.boardFlipped ? (this.nativeBounds[2]-x) : (x+this.nativeBounds[0]);

	var layerOrder = (this.boardFlipped) ? this.reverseRenderLayerOrder : this.renderLayerOrder;
	for (var i = layerOrder.length-1; i >= 0; i--) {
		var layerId = layerOrder[i];
		if (!this.shownLayers[layerId]) continue;
		var hitTestFunc = this.hitTestFunctions[layerId];
		if (!hitTestFunc) continue;
		var hit = hitTestFunc(this,x,y);
		if (hit) return hit;
	}
	return null;
}

EagleCanvas.prototype.hitTestElements = function(layer, x, y) {
	if (!layer) return;

	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey];
		var package = this.packagesByName[elem.package];

		var rotMat = elem.matrix;

		var bbox = package.bbox;
		if (bbox) {
			var layerNum = this.eagleLayersByName['Top'].number;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*bbox[0] + rotMat[1]*bbox[1];	//top left
			var y1 = elem.y + rotMat[2]*bbox[0] + rotMat[3]*bbox[1];
			var x2 = elem.x + rotMat[0]*bbox[2] + rotMat[1]*bbox[1];	//top right
			var y2 = elem.y + rotMat[2]*bbox[2] + rotMat[3]*bbox[1];
			var x3 = elem.x + rotMat[0]*bbox[2] + rotMat[1]*bbox[3];	//bottom right
			var y3 = elem.y + rotMat[2]*bbox[2] + rotMat[3]*bbox[3];
			var x4 = elem.x + rotMat[0]*bbox[0] + rotMat[1]*bbox[3];	//bottom left
			var y4 = elem.y + rotMat[2]*bbox[0] + rotMat[3]*bbox[3];
			if (this.pointInRect(x,y,x1,y1,x2,y2,x3,y3,x4,y4)) {
				return {'type':'element','name':elem.name};
			}
		}

		for (var smdIdx in package.smds) {
			var smd = package.smds[smdIdx];
			var layerNum = smd.layer;
			if (elem.mirror) layerNum = this.mirrorLayer(layerNum);
			if (layer.number != layerNum) continue;
			var x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1;	//top left
			var y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1;
			var x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y1;	//top right
			var y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y1;
			var x3 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2;	//bottom right
			var y3 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2;
			var x4 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y2;	//bottom left
			var y4 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y2;
			if (this.pointInRect(x,y,x1,y1,x2,y2,x3,y3,x4,y4)) {
				var padName = smd.name;
				if (padName) {
					var signalName = elem.padSignals[padName];
					if (signalName) return {'type':'signal','name':signalName};
				}
				return {'type':'element','name':elem.name};

			}
		}
	}
	return null;
}

EagleCanvas.prototype.hitTestSignals = function(layer, x, y) {
	for (var signalName in this.signalItems) {
		var signalLayers = this.signalItems[signalName];
		if (!signalLayers) continue;
		var layerItems = signalLayers[layer.number];
		if (!layerItems) continue;
		var layerWires = layerItems['wires'];
		if (!layerWires) continue;
		for (var wireIdx in layerWires) {
			var wire = layerWires[wireIdx];
			var x1 = wire.x1;
			var y1 = wire.y1;
			var x2 = wire.x2;
			var y2 = wire.y2;
			var width = wire.width;
			if (this.pointInLine(x,y,x1,y1,x2,y2,width)) return {'type':'signal','name':signalName};
		}
	}
	return null;
}

EagleCanvas.prototype.pointInLine = function(x, y, x1, y1, x2, y2, width) {
	var width2 = width * width;

	if (((x-x1)*(x-x1)+(y-y1)*(y-y1)) < width2) return true;	//end 1 
	if (((x-x2)*(x-x2)+(y-y2)*(y-y2)) < width2) return true;	//end 2

	var length2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
	if (length2 <= 0) return false;

	var s = ((y - y1) * (y2-y1) - (x - x1) * (x1-x2)) / length2;				// s = param of line p1..p2 (0..1)
	if ((s >= 0) && (s <= 1)) {													//between p1 and p2
		var px = x1 + s * (x2-x1);
		var py = y1 + s * (y2-y1);
		if (((x-px)*(x-px)+(y-py)*(y-py)) < width2) return true;	//end 2
	}
	return false;
}

EagleCanvas.prototype.pointInRect = function(x, y, x1, y1, x2, y2, x3, y3, x4, y4) {
	//p1..p4 in clockwise or counterclockwise order
	//Do four half-area tests
	return (((x-x1)*(x2-x1)+(y-y1)*(y2-y1)) >= 0)
		&& (((x-x1)*(x4-x1)+(y-y1)*(y4-y1)) >= 0)
		&& (((x-x3)*(x2-x3)+(y-y3)*(y2-y3)) >= 0)
		&& (((x-x3)*(x4-x3)+(y-y3)*(y4-y3)) >= 0);
}


// --------------------
// --- COMMON UTILS ---
// --------------------

EagleCanvas.prototype.colorPalette = [
	[  0,  0,  0], [ 35, 35,141], [ 35,141, 35], [ 35,141,141], [141, 35, 35], [141, 35,141], [141,141, 35], [141,141,141],
	[ 39, 39, 39], [  0,  0,180], [  0,180,  0], [  0,180,180], [180,  0,  0], [180,  0,180], [180,180,  0], [180,180,180]
];

EagleCanvas.prototype.layerColor = function(colorIdx) {
	var rgb = this.colorPalette[colorIdx];
	return 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
}

EagleCanvas.prototype.highlightColor = function(colorIdx) {
	var rgb = this.colorPalette[colorIdx];
	return 'rgb('+(rgb[0]+50)+','+(rgb[1]+50)+','+(rgb[2]+50)+')';
}

EagleCanvas.prototype.matrixForRot = function(rot) {
	var flipped = (rot.indexOf('M') == 0);
	var degreeString = rot.substring(flipped ? 2 : 1);
	var degrees = parseFloat(degreeString);
	var rad = degrees * Math.PI / 180.0;
	var flipSign = flipped ? -1 : 1;
	var mat = [flipSign * Math.cos(rad), flipSign * -Math.sin(rad), Math.sin(rad), Math.cos(rad)];
	return mat;
}

EagleCanvas.prototype.mirrorLayer = function(layerIdx) {
	if (layerIdx == 1) return 16;
	else if (layerIdx == 16) return 1;
	var name = this.layersByNumber[layerIdx].name;
	var prefix = name.substring(0,1);
	if (prefix == 't') {
		var mirrorName = 'b' + name.substring(1);
		var mirrorLayer = this.eagleLayersByName[mirrorName];
		if (mirrorLayer) return mirrorLayer.number;
	} else if (prefix == 'b') {
		var mirrorName = 't' + name.substring(1);
		var mirrorLayer = this.eagleLayersByName[mirrorName];
		if (mirrorLayer) return mirrorLayer.number;
	}
	return layerIdx;
}

EagleCanvas.prototype.calculateBounds = function() {
	var minX = EagleCanvas.LARGE_NUMBER;
	var minY = EagleCanvas.LARGE_NUMBER;
	var maxX = -EagleCanvas.LARGE_NUMBER;
	var maxY = -EagleCanvas.LARGE_NUMBER;
	//Plain elements
	for (var layerKey in this.plainWires) {
		var lines = this.plainWires[layerKey];
		for (var lineKey in lines) {
			var line = lines[lineKey];
			var x1 = line.x1;
			var x2 = line.x2;
			var y1 = line.y1;
			var y2 = line.y2;
			var width = line.width;
			if (x1-width < minX) minX = x1-width; if (x1+width > maxX) maxX = x1+width;
			if (x2-width < minX) minX = x2-width; if (x2+width > maxX) maxX = x2+width;
			if (y1-width < minY) minY = y1-width; if (y1+width > maxY) maxY = y1+width;
			if (y2-width < minY) minY = y2-width; if (y2+width > maxY) maxY = y2+width;
		}
	}

	//Elements
	for (var elemKey in this.elements) {
		var elem = this.elements[elemKey];
		var package = this.packagesByName[elem.package];
		var rotMat = elem.matrix;
		for (var smdIdx in package.smds) {
			var smd = package.smds[smdIdx];
			var x1 = elem.x + rotMat[0]*smd.x1 + rotMat[1]*smd.y1;
			var y1 = elem.y + rotMat[2]*smd.x1 + rotMat[3]*smd.y1;
			var x2 = elem.x + rotMat[0]*smd.x2 + rotMat[1]*smd.y2;
			var y2 = elem.y + rotMat[2]*smd.x2 + rotMat[3]*smd.y2;
			if (x1 < minX) minX = x1; if (x1 > maxX) maxX = x1;
			if (x2 < minX) minX = x2; if (x2 > maxX) maxX = x2;
			if (y1 < minY) minY = y1; if (y1 > maxY) maxY = y1;
			if (y2 < minY) minY = y2; if (y2 > maxY) maxY = y2;
		}
		for (var wireIdx in package.wires) {
			var wire = package.wires[wireIdx];
			var x1 = elem.x + rotMat[0]*wire.x1 + rotMat[1]*wire.y1;
			var y1 = elem.y + rotMat[2]*wire.x1 + rotMat[3]*wire.y1;
			var x2 = elem.x + rotMat[0]*wire.x2 + rotMat[1]*wire.y2;
			var y2 = elem.y + rotMat[2]*wire.x2 + rotMat[3]*wire.y2;
			var width = wire.width;
			if (x1-width < minX) minX = x1-width; if (x1+width > maxX) maxX = x1+width;
			if (x2-width < minX) minX = x2-width; if (x2+width > maxX) maxX = x2+width;
			if (y1-width < minY) minY = y1-width; if (y1+width > maxY) maxY = y1+width;
			if (y2-width < minY) minY = y2-width; if (y2+width > maxY) maxY = y2+width;
			if (x1 < minX) minX = x1; if (x1 > maxX) maxX = x1;
			if (x2 < minX) minX = x2; if (x2 > maxX) maxX = x2;
			if (y1 < minY) minY = y1; if (y1 > maxY) maxY = y1;
			if (y2 < minY) minY = y2; if (y2 > maxY) maxY = y2;
		}
	}
	return [minX, minY, maxX, maxY];
}

EagleCanvas.prototype.scaleToFit = function() {
	if (!this.scaleToFitId) return;
	var fitElement = document.getElementById(this.scaleToFitId);
	if (!fitElement) return;
	var fitWidth = fitElement.offsetWidth;
	var fitHeight = fitElement.offsetHeight;
	var scaleX = fitWidth / this.nativeSize[0];
	var scaleY = fitHeight / this.nativeSize[1];
	var scale = Math.min(scaleX, scaleY);
	scale *= 0.9;
	this.minScale = scale / 10;
	this.maxScale = scale * 10;
	this.setScale(scale);
}

