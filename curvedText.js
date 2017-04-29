

var CurvedText = function (canvas, options) {
  this.opts = options || {};
  for (prop in CurvedText.defaults) {
    this.opts[prop] = this.opts[prop] || CurvedText.defaults[prop];
  }
  this.canvas = canvas;

  this.letters = [];
  this._group();

  this._initEditor();
}


CurvedText.prototype._update = function () {
  this.opts.bezierCurve.update();

  this._controldots.forEach((dot, i) => {
    dot.set({
      left: this.opts.bezierCurve.points[i].x,
      top:  this.opts.bezierCurve.points[i].y,
    });
  });

  this._render();
  this._controldots.forEach((dot) => dot.bringToFront());
  this.canvas.renderAll();
};

CurvedText.prototype._positionControlDots = function () {
  
  var off = this._offset_p0_to_group;

  this._controldots.forEach((dot, i) => {
    dot.set({
      left: this.opts.bezierCurve.points[i].x - this.opts.bezierCurve.points[0].x + this.group.left + off.x,
      top:  this.opts.bezierCurve.points[i].y - this.opts.bezierCurve.points[0].y + this.group.top  + off.y,
    });
    dot.setCoords();
  });

  this.canvas.renderAll();
};

CurvedText.prototype._initEditor = function () {

  this._controldots = this.opts.bezierCurve.points.map(({x,y}, i) => {
    var dot = new fabric.Circle({
      left: x,
      top: y,
      strokeWidth: 4,
      radius: (i % 3 == 0) ? 10 : 6,
      fill: "#fff",
      stroke: "#555",
      originX: "center",
      originY: "center",
    });
    dot.isControlDot = true;
    dot.hasControls = false;
    this.canvas.add(dot);
    return dot;
  });

  this.canvas.on("object:moving", (e) => {
    if (e.target.isControlDot) {
      this.opts.bezierCurve.points = this._controldots.map((dot) => { return {
        x: dot.left,
        y: dot.top,
      }});
      this._update();
    } else if (e.target.isCurvedTextContainer) {
      this._positionControlDots();
    }
  });
};


CurvedText.prototype._group = function () {
  this.group = new fabric.Group(this.letters, {
    selectable: true,
    hasControls: this.opts.hasControls,
  });
  this.group.isCurvedTextContainer = true;

  if (this._callbacks) {
    for (event in this._callbacks) {
      this._callbacks[event].map((f) => this.group.on(event, f));
    }
  }

  this.canvas.add(this.group);
};

CurvedText.prototype._ungroup = function () {
  this.canvas.remove(this.group);
  this.group.destroy(); // restored letter positions
};


CurvedText.prototype.set = function (param, value, render) {

  if ( typeof param == "object" ) {
    for ( var i in param ) {
      this.set( i, param[i], false );
    }
  } else {
    if ( this.opts[param] !== undefined ) {
      this.opts[param] = value;
      if ( param === 'fontSize' || param === 'fontWeight' || param === 'fill' || param === 'fontFamily' ) {
        this._setFontStyles();
      }
      if ( param === 'text' ) {
        this.setText( value );
      }
    }
  }

  if (render === undefined || render !== false) {
    this._render();
  }
};

CurvedText.prototype.get = function( param ) {
  if (this.opts[param] !== undefined) {
    return this.opts[param];
  } else {
    return false;
  }
};

CurvedText.prototype.getParams = function() {
  return this.opts;
};

CurvedText.prototype.remove = function() {
  // TODO
};

CurvedText.prototype.setText = function (newText) {

  // remove redundant letters
  var N_remove = this.letters.length - newText.length;
  this.letters.splice(this.letters.letters, N_remove);

  for (var i = 0; i < newText.length; i++) {
    if (this.letters[i] == undefined) {
      this.letters[i] = new fabric.Text(newText[i], {
        selectable: false,
        centeredRotation: true,
        originX: "left",
        originY: "bottom"
      });
    }
    else{
      this.letters[i].text = newText[i];
    }
  }

  this.opts.text = newText;
  this._setFontStyles();
  this._render();
};

CurvedText.prototype._setFontStyles = function () {
  this.letters.forEach((letter) => letter.set({
    fontSize: this.opts.fontSize,
    lineHeight: 1,
    fontWeight: this.opts.fontWeight,
    fontFamily: this.opts.fontFamily,
    fill: this.opts.fill
  }));
};

CurvedText.prototype.on = function (event, callback) {
  if (!this._callbacks) {
    this._callbacks = {};
  }
  (this._callbacks[event] = this._callbacks[event] || []).push(callback);
  
  if (this.group) {
    this.group.on(event, callback);
  }
};

CurvedText.prototype._render = function() {

  var curve = this.opts.bezierCurve,
      N = this.letters.length,
      textDescent = this.opts.fontSize * .25,
      additionalSpacing = 10, // in 1000ths of 1 EM
      offsetLeft = 0,
      ctx = this.canvas.getContext();

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.font = [
    this.opts.fontStyle,
    this.opts.fontWeight,
    this.opts.fontSize + "px",
    this.opts.fontFamily,
  ].join(" ");

  // remove letters from group, restoring their positions
  this._ungroup();

  for (var i = 0; i < N; i++) {
    var charWidth = Math.max(0, ctx.measureText(this.letters[i].text).width),
        t         = curve.mappx(offsetLeft),
        t2        = curve.mappx(offsetLeft + charWidth / 2),
        pos       = curve.compute(t),
        normal    = curve.normal(t2),
        angle     = curve.angle(t2);

    this.letters[i].set({
      left: pos.x + normal.x * textDescent,
      top:  pos.y + normal.y * textDescent,
      angle: angle * (180 / Math.PI),
    });

    offsetLeft += charWidth + (additionalSpacing / 1000) * this.opts.fontSize;
  }

  // re-add letters to (new) group
  this._group();
  
  ctx.restore();
  this.canvas.renderAll();

  this._offset_p0_to_group = {
    x: this._controldots[0].left - this.group.left,
    y: this._controldots[0].top  - this.group.top,
  };
};



CurvedText.defaults = {
  top:        0,
  left:       0,
  text:       "Some curved text",
  fontSize:   fabric.Text.prototype.fontSize,
  fontStyle:  fabric.Text.prototype.fontStyle,
  fontWeight: fabric.Text.prototype.fontWeight,
  fontFamily: fabric.Text.prototype.fontFamily,
  fill:       fabric.Text.prototype.fill,
};
