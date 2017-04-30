

var CurvedText = function (canvas, options) {
  this.opts = options || {};
  for (prop in CurvedText.defaults) {
    this.opts[prop] = this.opts[prop] || CurvedText.defaults[prop];
  }
  this.canvas = canvas;

  this.manip = new PathManipulator(canvas, this.opts.curvePoints || [
    { x: this.opts.left,       y: this.opts.top + this.opts.fontSize * .75 },
    { x: this.opts.left + 200, y: this.opts.top + this.opts.fontSize * .75 },
  ]);
  this._editing = false;
  this.manip.hide();
  this.manip.onUpdate(() => this._render());

  this.curve = this.manip.ipath;

  this.letters = [];
  this._group();

  this.canvas.on("mouse:dblclick", (e) => {
    if (this._editing) {
      this.stopEditing();
    }
  });
}

CurvedText.prototype.stopEditing = function () {
  this._editing = false;
  this.manip.hide();
  this._render();
};

CurvedText.prototype.edit = function () {
  this._editing = true;
  this.manip.show();
  this._render();
};


CurvedText.prototype._group = function () {
  this.group = new fabric.Group(this.letters, {
    selectable: !this._editing,
    hasControls: this.opts.hasControls,
  });
  this.group.isCurvedTextContainer = true;

  if (this._callbacks) {
    for (event in this._callbacks) {
      this._callbacks[event].map((f) => this.group.on(event, f));
    }
  }

  this.canvas.add(this.group);

  if (this._editing) {
    this.group.sendToBack();
  } else {
    this.group.on("object:dblclick", (e) => {
      this.edit();
    });
  }
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
    fontSize:   this.opts.fontSize,
    lineHeight: 1,
    fontWeight: this.opts.fontWeight,
    fontFamily: this.opts.fontFamily,
    fill:       this.opts.fill
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

  console.log("CurvedText::_render()");

  var curve = this.curve,
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
        api       = curve.px(offsetLeft),
        api2      = curve.px(offsetLeft + charWidth / 2),
        pos       = api.compute(),
        normal    = api2.normal(),
        angle     = api2.angle();

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
