
// adapted from:
// https://gist.github.com/BonsaiDen/670236

function Bezier(a, b, c, d) {
  this.set(a,b,c,d);
}

Bezier.prototype = {

  set: function (a,b,c,d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;

    this.len = 100;
    this.arcLengths = new Array(this.len + 1);
    this.arcLengths[0] = 0;
    
    var ox = this.x(0), oy = this.y(0), clen = 0;
    for (var i = 1; i <= this.len; i += 1) {
      var x = this.x(i * 0.01), y = this.y(i * 0.01);
      var dx = ox - x, dy = oy - y;        
      clen += Math.sqrt(dx * dx + dy * dy);
      this.arcLengths[i] = clen;
      ox = x, oy = y;
    }
    this.length = clen;
  },

  map_u: function(u) {
    var targetLength = u * this.arcLengths[this.len];
    var low = 0, high = this.len, index = 0;
    while (low < high) {
      index = low + (((high - low) / 2) | 0);
      if (this.arcLengths[index] < targetLength) {
        low = index + 1;
      } else {
        high = index;
      }
    }
    if (this.arcLengths[index] > targetLength) {
      index--;
    }
    
    var lengthBefore = this.arcLengths[index];
    if (lengthBefore === targetLength) {
      return index / this.len;
    } else {
      return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.len;
    }
  },

  map_px: function (px) {
    return this.map_u(px / this.length);
  },
  
  x: function (t) {
    return ((1 - t) * (1 - t) * (1 - t)) * this.a.x
           + 3 * ((1 - t) * (1 - t)) * t * this.b.x
           + 3 * (1 - t) * (t * t) * this.c.x
           + (t * t * t) * this.d.x;
  },
  
  y: function (t) {
    return ((1 - t) * (1 - t) * (1 - t)) * this.a.y
           + 3 * ((1 - t) * (1 - t)) * t * this.b.y
           + 3 * (1 - t) * (t * t) * this.c.y
           + (t * t * t) * this.d.y;
  },
  
  dx: function (t) {
    return -3 * ((1 - t) * (1 - t)) * this.a.x
           + (3 * ((1 - t) * (1 - t)) - 6*t*(1-t)) * this.b.x
           + (6*t*(1-t) - 3*t*t) * this.c.x
           + 3*(t*t) * this.d.x;
  },
  
  dy: function (t) {
    return -3 * ((1 - t) * (1 - t)) * this.a.y
           + (3 * ((1 - t) * (1 - t)) - 6*t*(1-t)) * this.b.y
           + (6*t*(1-t) - 3*t*t) * this.c.y
           + 3*(t*t) * this.d.y;
  },



  compute: function (t) {
    return { x: this.x(t), y: this.y(t) };
  },

  compute_u: function (u) {
    return this.compute(this.map_u(u));
  },

  compute_px: function (px) {
    return this.compute(this.map_px(px));
  },

  derivative: function (t) {
    return { dx: this.dx(t), dy: this.dy(t) };
  },

  derivative_u: function (u) {
    return this.derivative(this.map_u(u));
  },

  derivative_px: function (px) {
    return this.derivative(this.map_px(px));
  },

  normal: function (t) {
    var d = this.derivative(t);
    var len = Math.sqrt(d.dx*d.dx + d.dy*d.dy);
    return { x: d.dy/len, y: -d.dx/len };
  },

  normal_u: function (u) {
    return this.normal(this.map_u(u));
  },

  normal_px: function (px) {
    return this.normal(this.map_px(px));
  },

  // in radians
  angle: function (t) {
    var nm = this.normal(t);
    return Math.atan(nm.x / -nm.y) + (nm.y > 0 ? Math.PI : 0);
  },

  angle_u: function (u) {
    return this.angle(this.map_u(u));
  },

  angle_px: function (px) {
    return this.angle(this.map_px(px));
  },
};