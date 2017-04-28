/***** Required : http://fabricjs.com *****/
var CurvedText = (function() {

    /**
    * Constructor
    * @method curvedText
    * @param canvas
    * @param {object} options
    */
    function CurvedText( canvas, options ){

      // Options
      this.opts = options || {};
      for ( prop in CurvedText.defaults ) {
         if (prop in this.opts) { continue; }
         this.opts[prop] = CurvedText.defaults[prop];
      }
      this.canvas = canvas;

      this.letters = [];
      this._group();
    }


    CurvedText.prototype._group = function () {
      this.group = new fabric.Group(this.letters, {
        selectable: false,
        hasControls: this.opts.hasControls,
      });
      this.canvas.add(this.group);
    };

    CurvedText.prototype._ungroup = function () {
      this.canvas.remove(this.group);
      this.group.destroy(); // restored letter positions
    };


    /**
    * @method set
    * @param {string} param
    * @param value
    * @return false if the param name is unknown
    */
    CurvedText.prototype.set = function( param, value, render ) {

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

          // TODO
          //if ( param === 'selectable' ) {
          //  this.group.selectable = value;
          //}

          if ( param === 'text' ) {
            this.setText( value );
          }

        }
      }

      if ( render === undefined || render !== false ) {
        this._render();
      }
    };
    
    /**
    * @method get
    * @param {string} param
    * @return value of param, or false if unknown
    */
    CurvedText.prototype.get = function( param ) {
      if ( this.opts[param] !== undefined ) {
        return this.opts[param];
      } else {
        return false;
      }
    };
    
    /**
    * @method getParams
    * @return {object} value of every options
    */
    CurvedText.prototype.getParams = function() {
      return this.opts;
    };
    

    /**
    * Remove all letters from canvas
    * @method remove
    */
    CurvedText.prototype.remove = function() {

      // TODO


      /*
      var size = this.group.size();
      for ( var i=size; i>=0; i-- ){
        this.group.remove( this.group.item(i) );
      }*/
      this.group.destroy();
      this.canvas.remove( this.group );
      this.canvas.renderAll();
    };
    
    /**
    * Used to change the text
    * @method setText
    * @param {string} newText
    */
    CurvedText.prototype.setText = function (newText) {

      // remove redundant letters
      var N_remove = this.letters.length - newText.length;
      this.letters.splice(this.letters.letters, N_remove);

      if (newText.length > 0) {
        for (var i = 0; i < newText.length; i++) {
          if (this.letters[i] == undefined) {
            this.letters[i] = new fabric.Text(newText[i], {
              selectable: false,
              centeredRotation: true,
              originX: 'center',
              originY: 'center'
            });
          }
          else{
            this.letters[i].text = newText[i];
          }
        }
      }
      this.opts.text = newText;
      this._setFontStyles();
      this._render();
    };
    
    /**
    * Update font size and weight
    * @private
    * @method _setFontStyles
    */
    CurvedText.prototype._setFontStyles = function () {
      if (this.letters.length > 0) {
        for (var i = 0; i < this.letters.length; i++) {
          this.letters[i].set({
            fontSize: this.opts.fontSize,
            lineHeight: 1,
            fontWeight: this.opts.fontWeight,
            fontFamily: this.opts.fontFamily,
            fill: this.opts.fill
          });
        }
      }
    };

    
    /**
     * @method on
     */
    CurvedText.prototype.on = function( event, callback ){

      // TODO

      this.group.on( event, callback );
    };
    
    /**
    * calculate the position and angle of each letter
    * @private
    * @method _render
    */
    CurvedText.prototype._render = function() {

        var N = this.letters.length;

        // remove letters from group, restoring their positions
        this._ungroup();

        for (var i = 0; i < N; i++) {
          var p = this.opts.bezierCurve.compute_m((i+.5)/N);
          var nm = this.opts.bezierCurve.normal_m((i+.5)/N);
          this.letters[i].set({
            left: p.x,
            top: p.y,
            angle: Math.atan(nm.x / -nm.y) * (180 / Math.PI),
          });
        }
      
        // re-add letters to (new) group
        this._group();
        
        this.canvas.renderAll();
    };



    /**
    * Default options
    */
    CurvedText.defaults = {
      top: 0,
      left: 0,
      spacing: 20,
      rotate: 0,
      radius: 50,
      radiusX: null,
      radiusY: null,
      text: 'Curved text',
      align: 'center',
      reverse: false,
      fontSize: 20,
      fontWeight: 'normal',
      fontFamily: 'Arial',
      fill: '#000',
      selectable: true,
      hasControls: false,
      bezierCurve: null,
    };

    return CurvedText;
})();

