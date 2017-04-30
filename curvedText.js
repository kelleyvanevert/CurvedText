


var PathManipulator = function (canvas, points) {
  this.canvas = canvas;

  this._callbacks = [];

  this.ipath = new InterpolatedPath();

  this.mouse = new fabric.Circle({
    left: -20,
    top:  -20,
    strokeWidth: 0,
    radius: 6,
    fill: "#ddd",
    originX: "center",
    originY: "center",
  });
  this.mouse.isMouse = true;
  this.mouse.hasControls = false;
  this.mouse.hasBorder = false;
  this.canvas.add(this.mouse);


  var insertAt, proj;

  this.canvas.on("mouse:move", (e) => {
    var mouseAt = this.canvas.getPointer(e.e);
    this.mouse.left = mouseAt.x;
    this.mouse.top  = mouseAt.y;

    var best = this.ipath.closest(mouseAt);
    if (best && best.mdist < 70) {
      this.mouse.set({
        left: best.proj.x,
        top:  best.proj.y,
      });
      proj = best.proj;
      insertAt = best.curve_i + 1;
    } else {
      proj = null;
      insertAt = undefined;
    }

    this.canvas.renderAll();
  });

  this.canvas.on("mouse:dblclick", (e) => {
    if (proj) {
      this.addPoint(proj, insertAt);
    } else {
      this.addPoint(this.canvas.getPointer(e.e));
    }
  });

  this.canvas.on("object:moving", (e) => {
    if (e.target.isControlDot2) {
      e.target.point.x = e.target.left;
      e.target.point.y = e.target.top;
      this._update();
    }
  });

  $(window).on("keydown", (e) => {
    //window.e = e; console.log("e.which = " + e.which + ", e.key = " + e.key);

    if (e.which == 46) { // delete
      if (this._deleteKey()) {
        return false;
      }
    }
  });

  (points || []).forEach((p) => this.addPoint(p));

  this._update();
}

PathManipulator.prototype._deleteKey = function () {
  var obj, grp;

  if (obj = this.canvas.getActiveObject()) {
    if (obj.isControlDot2) {
      this._deletePoint(obj.point);
      return true;
    }
  } else if (grp = this.canvas.getActiveGroup()) {
    var deleted = 0,
        objects = grp.getObjects().slice();

    for (var i = 0; i < objects.length; i++) {
      if (objects[i].isControlDot2) {
        if (i == objects.length - 1 && i == deleted) {
          this.canvas.discardActiveGroup();
          this.canvas.renderAll();
        } else {
          grp.removeWithUpdate(objects[i]);
        }
        this._deletePoint(objects[i].point);
        deleted++;
      }
    }

    if (deleted) {
      return true;
    }
  }

  return false;
};

// TODO
PathManipulator.prototype._deletePoint = function (point) {

  this.ipath.deletePoint(point);
  this.canvas.remove(point.dot);

  this._update();
};

PathManipulator.prototype.addPoint = function (point, insertAt) {

  this.ipath.addPoint(point, insertAt);

  var dot = new fabric.Circle({
    left: point.x,
    top: point.y,
    strokeWidth: 4,
    radius: 8,
    fill: "#fff",
    stroke: "#555",
    originX: "center",
    originY: "center",
  });
  dot.point = point;
  point.dot = dot;
  dot.isControlDot2 = true;
  dot.hasControls = false;
  this.canvas.add(dot);

  this._update();
};

PathManipulator.prototype._update = function () {

  this.ipath._update();

  var d = this.ipath.getPathD();
  if (this.path) {
    this.canvas.remove(this.path);
  }
  if (d) {
    this.path = new fabric.Path(d, {
      fill: "",
      stroke: "black",
      objectCaching: false,
      selectable: false,
    });
    this.canvas.add(this.path);
  }

  this.ipath.points.forEach((p) => p.dot.bringToFront());

  this.canvas.renderAll();

  this._callbacks.map((f) => f());
};

PathManipulator.prototype.bringToFront = function (argument) {
  this.ipath.points.forEach((p) => p.dot.bringToFront());
}

PathManipulator.prototype.onUpdate = function (f) {
  this._callbacks.push(f);
};








var CurvedText = function (canvas, options) {
  this.opts = options || {};
  for (prop in CurvedText.defaults) {
    this.opts[prop] = this.opts[prop] || CurvedText.defaults[prop];
  }
  this.canvas = canvas;

  this.letters = [];
  this._group();
}


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

  console.log("CurvedText::_render()");

  var curve = this.opts.curve,
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
