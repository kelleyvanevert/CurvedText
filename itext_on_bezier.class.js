(function() {

  var clone = fabric.util.object.clone;

  fabric.ITextOnBezier = fabric.util.createClass(fabric.IText, /*fabric.TextOnBezier,*/ fabric.Observable, /** @lends fabric.ITextOnBezier.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'i-text-on-bezier',

    bezier: new Bezier([
      { x:  80, y: 260 },
      { x: 180, y: 360 },
      { x: 180, y:  80 },
      { x: 280, y: 330 },
    ]),

    // hack, so as to obstruct the calling of fabric.Text's rendering methods
    //     (which would be used for efficiency reasons)
    isEmptyStyles: function () {
      return false;
    },


    renderCursor: function(boundaries, ctx) {

      var cursorLocation = this.get2DCursorLocation(),
          lineIndex = cursorLocation.lineIndex,
          charIndex = cursorLocation.charIndex,
          charHeight = this.getCurrentCharFontSize(lineIndex, charIndex),
          leftOffset = boundaries.leftOffset,
          multiplier = this.scaleX * this.canvas.getZoom(),
          cursorWidth = this.cursorWidth / multiplier,
          bezierPos   = this.bezier.compute_px(leftOffset - cursorWidth / 2),
          bezierAngle = this.bezier.angle_px(leftOffset - cursorWidth / 2);

      ctx.fillStyle = this.getCurrentCharColor(lineIndex, charIndex);
      ctx.globalAlpha = this.__isMousedown ? 1 : this._currentCursorOpacity;

      console.log(window.b=boundaries);

      ctx.save();
//      ctx.rotate(bezierAngle);

      ctx.fillRect(
        boundaries.left + leftOffset - cursorWidth / 2,
        boundaries.top + boundaries.topOffset,
        cursorWidth,
        charHeight);

      ctx.restore();
    },

    _renderChars: function(method, ctx, line, left, top, lineIndex, charOffset) {

      charOffset = charOffset || 0;

      // set proper line offset
      var lineHeight = this._getHeightOfLine(ctx, lineIndex),
          prevStyle,
          thisStyle,
          charsToRender = '';

      ctx.save();
      top -= lineHeight / this.lineHeight * this._fontSizeFraction;
      for (var i = charOffset, len = line.length + charOffset; i <= len; i++) {
        prevStyle = prevStyle || this.getCurrentCharStyle(lineIndex, i);
        thisStyle = this.getCurrentCharStyle(lineIndex, i + 1);

        if (this._hasStyleChanged(prevStyle, thisStyle) || i === len) {
          this._renderChar(method, ctx, lineIndex, i - 1, charsToRender, left, top, lineHeight);
          charsToRender = '';
          prevStyle = thisStyle;
        }
        charsToRender += line[i - charOffset];
      }
      ctx.restore();
    },

    _renderChar: function(method, ctx, lineIndex, i, _char, left, top, lineHeight) {
      console.log("ITextOnBezier::_renderChar");

      var charWidth, charHeight, shouldFill, shouldStroke,
          decl = this._getStyleDeclaration(lineIndex, i),
          offset, textDecoration, chars, additionalSpace, _charWidth,
          bezierPos, bezierAngle, dx, dy;

      if (decl) {
        charHeight = this._getHeightOfChar(ctx, _char, lineIndex, i);
        shouldStroke = decl.stroke;
        shouldFill = decl.fill;
        textDecoration = decl.textDecoration;
      }
      else {
        charHeight = this.fontSize;
      }

      shouldStroke = (shouldStroke || this.stroke) && method === 'strokeText';
      shouldFill = (shouldFill || this.fill) && method === 'fillText';

      decl && ctx.save();

      charWidth = this._applyCharStylesGetWidth(ctx, _char, lineIndex, i, decl || null);
      textDecoration = textDecoration || this.textDecoration;

      if (decl && decl.textBackgroundColor) {
        this._removeShadow(ctx);
      }

      additionalSpace = this._getWidthOfCharSpacing();
      chars = _char.split('');
      charWidth = 0;
      bezierPos   = this.bezier.compute_px(charWidth);
      bezierAngle = this.bezier.angle_px(charWidth);
      dx = bezierPos.x - left;
      dy = bezierPos.y - top;

      for (var j = 0, len = chars.length, jChar; j < len; j++) {
        jChar = chars[j];
        
        ctx.save();
        ctx.translate(bezierPos.x - dx, bezierPos.y - dy);
        ctx.rotate(bezierAngle);

        shouldFill   && ctx.fillText(jChar,   0, 0);
        shouldStroke && ctx.strokeText(jChar, 0, 0);

        ctx.restore();

        charWidth  += Math.max(0, ctx.measureText(jChar).width + additionalSpace);
        bezierPos   = this.bezier.compute_px(charWidth);
        bezierAngle = this.bezier.angle_px(charWidth);
      }

      if (textDecoration || textDecoration !== '') {
        offset = this._fontSizeFraction * lineHeight / this.lineHeight;
        this._renderCharDecoration(ctx, textDecoration, left, top, offset, charWidth, charHeight);
      }

      decl && ctx.restore();
      ctx.translate(charWidth, 0);
    },

  });

})();
