
var PathManipulator = function (canvas, points) {
  this.canvas = canvas;

  this._callbacks = [];

  this._visible = true;

  this.ipath = new InterpolatedPath();

  this.mouse = new fabric.Circle({
    left: -20,
    top:  -20,
    strokeWidth: 0,
    radius: 6,
    fill: "#999",
    originX: "center",
    originY: "center",
  });
  this.mouse.isMouse = true;
  this.mouse.hasControls = false;
  this.mouse.hasBorder = false;
  this.canvas.add(this.mouse);


  var insertAt, proj;

  this.canvas.on("mouse:move", (e) => {
    if (!this._visible) {
      return;
    }

    var mouseAt = this.canvas.getPointer(e.e);
    this.mouse.left = mouseAt.x;
    this.mouse.top  = mouseAt.y;

    var best = this.ipath.closest(mouseAt);
    if (best && best.mdist < 20
          && Bezier.dist(best.curve.points[0], best.proj) > 20
          && Bezier.dist(best.curve.points[best.curve.points.length - 1], best.proj) > 20)
    {
      this.mouse.set({
        left: best.proj.x,
        top:  best.proj.y,
      });
      proj = best.proj;
      insertAt = best.curve_i + 1;
      this.mouse.visible = true;
    } else {
      proj = null;
      insertAt = undefined;
      this.mouse.visible = false;
    }

    this.canvas.renderAll();
  });

  this.canvas.on("mouse:down", (e) => {
    if (e.target && e.target.isControlDot2) {
      return;
    }

    if (!this._visible) {
      return;
    }

    if (proj) {
      this.addPoint(proj, insertAt);
      return false;
    } else {
      //this.addPoint(this.canvas.getPointer(e.e));
    }
  });

  this.canvas.on("object:moving", (e) => {
    if (!this._visible) {
      return;
    }

    if (e.target.isControlDot2) {
      e.target.point.x = e.target.left;
      e.target.point.y = e.target.top;
      this._update();
    }
  });

  $(window).on("keydown", (e) => {
    if (!this._visible) {
      return;
    }
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

PathManipulator.prototype.hide = function () {
  this._visible = false;
  this.ipath.points.map((p) => { p.dot.visible = false; });
  if (this.path) {
    this.path.visible = false;
  }
  if (this.mouse) {
    this.mouse.visible = false;
  }

  // TODO:
  // deselect if necessary
};

PathManipulator.prototype.show = function () {
  this._visible = true;
  this.ipath.points.map((p) => { p.dot.visible = true; });
  if (this.path) {
    this.path.visible = true;
  }
  if (this.mouse) {
    this.mouse.visible = true;
  }
  this._update();
};

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
    strokeWidth: 0,
    radius: 12,
    fill: "rgba(0, 0, 0, .1)",
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

  this.ipath.points.forEach((p) => {
    p.dot.bringToFront();
    p.dot.set({
      left: p.x,
      top:  p.y,
    });
    p.dot.setCoords();
  });

  this.canvas.renderAll();

  this._callbacks.map((f) => f());
};

PathManipulator.prototype.bringToFront = function (argument) {
  this.ipath.points.forEach((p) => p.dot.bringToFront());
}

PathManipulator.prototype.onUpdate = function (f) {
  this._callbacks.push(f);
};
