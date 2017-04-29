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

  /**
   * TextOnBezier class
   * @class fabric.TextOnBezier
   * @extends fabric.Text
   * @return {fabric.TextOnBezier} thisArg
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-2#text}
   * @see {@link fabric.TextOnBezier#initialize} for constructor definition
   */
  fabric.TextOnBezier = fabric.util.createClass(fabric.Text, fabric.Observable, /** @lends fabric.TextOnBezier.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'text-on-bezier',

    bezier: new Bezier(
      { x: -100 + 180, y:   80 + 180 },
      { x:  100 + 180, y:  150 + 180 },
      { x:  240 + 180, y: -100 + 180 },
      { x:  300 + 180, y:    0 + 180 }
    ),

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


    // TODO:
    // _initDimensions(ctx) { calculate according to bezier }


    _renderChars: function(method, ctx, chars, left, top) {
      console.log("TextOnBezier::_renderChars");

      // remove Text word from method var
      var shortM = method.slice(0, -4), _char, width;

      if (this[shortM].toLive) {
        var offsetX = -this.width / 2 + this[shortM].offsetX || 0,
            offsetY = -this.height / 2 + this[shortM].offsetY || 0;
        ctx.save();
        ctx.translate(offsetX, offsetY);
        left -= offsetX;
        top -= offsetY;
      }

      // THE DRAWING
      var additionalSpace = this._getWidthOfCharSpacing(),
          accum_px = 0,
          pos   = this.bezier.compute_px(accum_px),
          angle = this.bezier.angle_px(accum_px),
          dx = pos.x - left,
          dy = pos.y - top;

      chars = chars.split('');
      for (var i = 0, len = chars.length; i < len; i++) {
        _char = chars[i];

        // what to do with `left` / `top` ?

        //ctx[method](_char, left + accum_px, top);
//        console.log("draw char at " + (pos.x - dx) + ", " + (pos.y - dy));
        ctx.save();
        ctx.translate(pos.x - dx, pos.y - dy);
        ctx.rotate(angle);
        ctx[method](_char, 0, 0);
        ctx.restore();

        accum_px += Math.max(0, ctx.measureText(_char).width + additionalSpace);
        pos   = this.bezier.compute_px(accum_px);
        angle = this.bezier.angle_px(accum_px);
      }

      this[shortM].toLive && ctx.restore();
    },

  });

  fabric.util.createAccessors(fabric.TextOnBezier);

})(typeof exports !== 'undefined' ? exports : this);
