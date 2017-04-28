(function(global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  if (fabric.BezierText) {
    fabric.warn('fabric.BezierText is already defined.');
    return;
  }

  fabric.BezierText = fabric.util.createClass(fabric.Object, {

    type: "beziertext",

    fontSize: 20,
    fontWeight: 'normal',
    fontFamily: 'Arial',
    fill: '#000',

    bezier: new Bezier(
      { x: -100 + 180, y:   80 + 180 },
      { x:  100 + 180, y:  150 + 180 },
      { x:  240 + 180, y: -100 + 180 },
      { x:  300 + 180, y:    0 + 180 }
    ),

    initialize: function (text, options) {
      this.callSuper("initialize", options);

      console.log("init");

      this.letters = [];
      this._group();

      this.setText(text);

      this.on("added", () => this._onAdded());
    },

    _set: function (key, value) {
      this.callSuper("_set", key, value);
      if (key === "text") {
        this.setText(value);
      } else if (key === "bezier") {
        this.setBezier(value);
      }
      return this;
    },

    // TODO: include the bezier curve (as a simple integer array or something)
    toObject: function (propertiesToInclude) {
      return this.callSuper("toObject", ["text"].concat(propertiesToInclude));
    },

    toSVG: function () {
      return ""; // TODO
    },

    _group: function () {
      this.group = new fabric.Group(this.letters, {
        selectable: false,
        hasControls: false,
      });
      if (this.canvas) {
        this.canvas.add(this.group);
      }
    },

    _ungroup: function () {
      if (this.group) {
        if (this.canvas) {
          this.canvas.remove(this.group);
        }
        this.group.destroy(); // restored letter positions
      }
    },

    _render: function () {
      var N = this.letters.length;

      // remove letters from group, restoring their positions
      this._ungroup();

      for (var i = 0; i < N; i++) {
        var p = this.bezier.compute_m((i+.5)/N);
        var nm = this.bezier.normal_m((i+.5)/N);
        this.letters[i].set({
          left: p.x,
          top: p.y,
          angle: Math.atan(nm.x / -nm.y) * (180 / Math.PI),
        });
      }
    
      // re-add letters to (new) group
      this._group();
      
      if (this.canvas) {
        this.canvas.renderAll();
      }
    },

    _onAdded: function () {
      console.log("Hi");
      this._render();
    },


    _setFontStyles: function () {
      for (var i = 0; i < this.letters.length; i++) {
        this.letters[i].set({
          fontSize: this.fontSize,
          lineHeight: 1,
          fontWeight: this.fontWeight,
          fontFamily: this.fontFamily,
          fill: this.fill,
        });
      }
    },


    setText: function (text) {
      this.text = text;

      // remove redundant letters
      var N_remove = this.letters.length - this.text.length;
      this.letters.splice(this.letters.letters, N_remove);

      if (this.text.length > 0) {
        for (var i = 0; i < this.text.length; i++) {
          if (this.letters[i] == undefined) {
            this.letters[i] = new fabric.Text(this.text[i], {
              selectable: false,
              centeredRotation: true,
              originX: 'center',
              originY: 'center'
            });
          }
          else{
            this.letters[i].text = this.text[i];
          }
        }
      }
      this._setFontStyles();
    },

    getText: function () {
      return this.text;
    },

    setBezier: function (bezier) {
      this.bezier = bezier;
    },

    getBezier: function () {
      return this.bezier;
    },
  });

  // possibly some static methods

})(typeof exports !== 'undefined' ? exports : this);