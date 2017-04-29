(function(global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = { }),
      toFixed = fabric.util.toFixed,
      NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS,
      MIN_TEXT_WIDTH = 2;

  if (fabric.TextOnBezier) {
    fabric.warn('fabric.TextOnBezier is already defined');
    return;
  }

  var Bounds = function (xmin, xmax, ymin, ymax) {
    this.xmin = xmin;
    this.xmax = xmax;
    this.ymin = ymin;
    this.ymax = ymax;
  };
  Bounds.prototype.include = function (p) {
    this.xmin = Math.min(this.xmin, p.x);
    this.ymin = Math.min(this.ymin, p.y);
    this.xmax = Math.max(this.xmax, p.x);
    this.ymax = Math.max(this.ymax, p.y);
  };
  Bounds.prototype.getWidth = function () {
    return this.xmax - this.xmin;
  };
  Bounds.prototype.getHeight = function () {
    return this.ymax - this.ymin;
  };

  /**
   * TextOnBezier class
   * @class fabric.TextOnBezier
   * @extends fabric.Text
   * @return {fabric.TextOnBezier} thisArg
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-2#text}
   * @see {@link fabric.TextOnBezier#initialize} for constructor definition
   */
  fabric.TextOnBezier = fabric.util.createClass(fabric.Text, fabric.Observable, /** @lends fabric.TextOnBezier.prototype */ {

    _debug: true,

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'text-on-bezier',

    bezier: new Bezier([
      { x:  80, y: 260 },
      { x: 180, y: 360 },
      { x: 180, y:  80 },
      { x: 280, y: 330 },
    ]),

    /**
     * Constructor
     * @param {String} text TextOnBezier string
     * @param {Object} [options] Options object
     * @return {fabric.TextOnBezier} thisArg
     */
    initialize: function(text, options) {
      this.styles = options ? (options.styles || { }) : { };
      this.callSuper('initialize', text, options);

      // (not sure if this is the right way)
      this.set("_dimensionAffectingProps", this._dimensionAffectingProps.concat(["bezier"]));
    },



    _initDimensions: function(ctx) {
      if (this.__skipDimension) {
        return;
      }
      if (!ctx) {
        ctx = fabric.util.createCanvasElement().getContext('2d');
        this._setTextStyles(ctx);
      }
      this._textLines = this._splitTextIntoLines();
      this._clearCache();

      // this.width = this._getTextWidth(ctx) || this.cursorWidth || MIN_TEXT_WIDTH;
      // this.height = this._getTextHeight(ctx);

      this._bbox = this.bezier.pBezier.bbox();
      this.width = this._bbox.x.size;
      this.height = this._bbox.y.size;

      this._calculate(ctx);
    },

    _calculate: function (ctx) {

      // Calculate positions & angles of characters
      this._renderData = [];

      var N = this.text.length,
          additionalSpace = this._getWidthOfCharSpacing(),
          charWidth,
          accum_offsetLeft = 0,
          pos    = this.bezier.pcompute_px(accum_offsetLeft),
          normal = this.bezier.pnormal_px(accum_offsetLeft),
          angle  = this.bezier.pangle_px(accum_offsetLeft),
          textBounds = new Bounds(pos.x, pos.x, pos.y, pos.y),
          fontAscent  = this.fontSize * (1 - this._fontSizeFraction) * this.lineHeight,
          fontDescent = this.fontSize * this._fontSizeFraction * this.lineHeight;

      for (var i = 0; i < N; i++) {
        charWidth = ctx.measureText(this.text[i]).width;
        this._renderData[i] = {
          pos:        pos,
          angle:      angle,
          charWidth:  charWidth,
          lineHeight: this._getHeightOfLine(),
        };

        textBounds.include({ x: pos.x - normal.x * fontAscent,  y: pos.y - normal.y * fontAscent  });
        textBounds.include({ x: pos.x + normal.x * fontDescent, y: pos.y + normal.y * fontDescent });

        accum_offsetLeft += Math.max(0, charWidth + additionalSpace);
        pos   = this.bezier.pcompute_px(accum_offsetLeft);
        angle = this.bezier.pangle_px(accum_offsetLeft);
      }

      this.width = textBounds.getWidth();
      this.height = textBounds.getHeight();
      this.offsetX = textBounds.xmin;
      this.offsetY = textBounds.ymin;

      console.log(textBounds);

    },

    _render: function (ctx) {

      if (this._debug) {
        ctx.save();
        ctx.translate(-this.width/2 - this.offsetX, -this.height/2 - this.offsetY);
        
        // draw bezier's bounding box
        ctx.fillStyle = "rgba(0, 0, 0, .025)";
        ctx.fillRect(0, 0, this._bbox.x.size, this._bbox.y.size);

        // draw bezier
        var ps = this.bezier.pBezier.points;
        ctx.moveTo(ps[0].x, ps[0].y);
        ctx.bezierCurveTo(ps[1].x, ps[1].y, ps[2].x, ps[2].y, ps[3].x, ps[3].y);
        ctx.stroke();

        // draw pre-computed character positions
        ctx.strokeStyle = "rgba(0, 0, 0, .1)";
        for (var i = 0; i < this.text.length; i++) {
          ctx.save();
          ctx.translate(this._renderData[i].pos.x, this._renderData[i].pos.y);
          ctx.rotate(this._renderData[i].angle);

          // see `fabric.Text::_renderTextLine`
          ctx.translate(0, this.fontSize * this._fontSizeFraction * this.lineHeight);
          
          ctx.strokeRect(0, 0, this._renderData[i].charWidth, -this._renderData[i].lineHeight);
          ctx.restore();
        }

        ctx.restore();
      }

      // DRAW TEXT

      this._setTextStyles(ctx);

      ctx.save();
      ctx.translate(-this.width/2 - this.offsetX, -this.height/2 - this.offsetY);
      
      for (var i = 0; i < this.text.length; i++) {
        ctx.save();
        ctx.translate(this._renderData[i].pos.x, this._renderData[i].pos.y);
        ctx.rotate(this._renderData[i].angle);

        ctx.fillText(this.text[i], 0, 0);
        ctx.restore();
      }

      ctx.restore();
    },

  });

  fabric.util.createAccessors(fabric.TextOnBezier);

})(typeof exports !== 'undefined' ? exports : this);
