// credits: rectangleworld.com
// modified by guilherme pontes

class Smoke {
  get defaults() {
    return {
      gradientStart: '#000000',
      gradientEnd: '#222222',
      smokeOpacity: 0.1,
      numCircles: 1,
      maxMaxRad: 'auto',
      minMaxRad: 'auto',
      minRadFactor: 0,
      iterations: 8,
      drawsPerFrame: 3,
      lineWidth: 5,
      speed: 1,
      bgColorInner: '#ffffff',
      bgColorOuter: '#666666',
    }
  }

  constructor(element, options) {
    this.element = element;
    this.settings = { ...this.defaults, ...options };
    this.timer = null;
    this.circles = [];
    this.TWO_PI = Math.PI * 2;

    this.init();
  }

  init() {
    this.initSettings();
    this.initCanvas();
    this.generate();
  }

  initSettings() {
    const radius = this.element.clientHeight * 0.8/2;
    let { maxMaxRad, minMaxRad } = this.settings;

    if (maxMaxRad === 'auto') this.settings.maxMaxRad = radius;
    if (minMaxRad === 'auto') this.settings.minMaxRad = radius;
  }

  initCanvas() {
    this.displayCanvas = this.element.querySelector('canvas');
    this.displayWidth = this.element.clientWidth;
    this.displayHeight = this.element.clientHeight;
    this.displayCanvas.width = this.displayWidth;
    this.displayCanvas.height = this.displayHeight;
    this.context = this.displayCanvas.getContext('2d');

    //off screen canvas used only when exporting image
    this.exportCanvas = document.createElement('canvas');
    this.exportCanvas.width = this.displayWidth;
    this.exportCanvas.height = this.displayHeight;
    this.exportContext = this.exportCanvas.getContext('2d');
  }

  generate() {
    this.drawCount = 0;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.fillBackground();
    this.setCircles();

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(this.onTimer.bind(this), this.settings.speed);
  }

  fillBackground() {
    const outerRad = Math.sqrt(
      this.displayWidth *
      this.displayWidth +
      this.displayHeight *
      this.displayHeight
    ) / 2;

    this.niceGradient = new SmokeBackground (
      this.displayWidth * 0.75,
      this.displayHeight / 2 * 0.75,
      0,
      this.displayWidth / 2,
      this.displayHeight / 4,
      outerRad
    );

    const { bgColorInner, bgColorOuter } = this.settings;
    const innerHex = bgColorInner.replace('#', '');
    const outerHex = bgColorOuter.replace('#','');


    const r0 = parseInt(innerHex.substring(0, 2), 16);
    const g0 = parseInt(innerHex.substring(2, 4), 16);
    const b0 = parseInt(innerHex.substring(4, 6), 16);

    const r1 = parseInt(outerHex.substring(0, 2), 16);
    const g1 = parseInt(outerHex.substring(2, 4), 16);
    const b1 = parseInt(outerHex.substring(4, 6), 16);

    this.niceGradient.addColorStop(0, r0, g0, b0);
    this.niceGradient.addColorStop(1, r1, g1, b1);
    this.niceGradient.fillRect(
      this.context,
      0,
      0,
      this.displayWidth,
      this.displayHeight
    );
  }

  setCircles() {
    const {
      numCircles,
      minRadFactor,
      minMaxRad,
      maxMaxRad,
      gradientStart,
      gradientEnd,
      smokeOpacity,
      iterations,
    } = this.settings;

    for (let i = 0; i < numCircles; i++) {
      const maxR = minMaxRad + Math.random() * (maxMaxRad - minMaxRad);
      const minR = minRadFactor * maxR;

      const grad = this.context.createRadialGradient(0, 0, minR, 0, 0, maxR);
      grad.addColorStop(1, this.hexToRGBA(gradientStart, smokeOpacity));
      grad.addColorStop(0, this.hexToRGBA(gradientEnd, smokeOpacity));

      const newCircle = {
        centerX: -maxR,
        centerY: this.displayHeight/2-50,
        maxRad : maxR,
        minRad : minR,
        color: grad,
        param : 0,
        changeSpeed : 1/250,
        phase : Math.random() * this.TWO_PI,
        globalPhase: Math.random() * this.TWO_PI
      };

      this.circles.push(newCircle);
      newCircle.pointList1 = this.setLinePoints(iterations);
      newCircle.pointList2 = this.setLinePoints(iterations);
    }
  }

  onTimer() {
    const xSqueeze = 0.75;
    const {
      drawsPerFrame,
      numCircles,
      iterations,
      lineWidth,
      maxMaxRad,
    } = this.settings;

    for (let j = 0; j < drawsPerFrame; j++) {
      this.drawCount++;

      for (let i = 0; i < numCircles; i++) {
        const c = this.circles[i];
        c.param += c.changeSpeed;

        if (c.param >= 1) {
          c.param = 0;
          c.pointList1 = c.pointList2;
          c.pointList2 = this.setLinePoints(iterations);
        }

        const cosParam = (
          0.5 -
          0.5 *
          Math.cos(Math.PI * c.param)
        );

        this.context.strokeStyle = c.color;
        this.context.lineWidth = lineWidth;

        this.context.beginPath();
        let point1 = c.pointList1.first;
        let point2 = c.pointList2.first;

        c.phase += 0.0002;

        let theta = c.phase;
        let rad = (
          c.minRad +
          (
            point1.y + cosParam *
            (point2.y - point1.y)
          ) *
          (c.maxRad - c.minRad)
        );

        c.centerX += 0.5;
        c.centerY += 0.04;

        const yOffset = (
          40 *
          Math.sin(
            c.globalPhase +
            this.drawCount /
            1000 *
            this.TWO_PI
          )
        );

        if (c.centerX > this.displayWidth + maxMaxRad) {
          clearInterval(this.timer);
          this.timer = null;
        }

        this.context.setTransform(
          xSqueeze,
          0,
          0,
          1,
          c.centerX,
          c.centerY + yOffset
        );

        let x0 = xSqueeze * rad * Math.cos(theta);
        let y0 = rad * Math.sin(theta);

        this.context.lineTo(x0, y0);

        while (point1.next != null) {
          point1 = point1.next;
          point2 = point2.next;

          theta = (
            this.TWO_PI *
            (
              point1.x +
              cosParam *
              (point2.x - point1.x)
            ) +
            c.phase
          );

          rad = (
            c.minRad +
            (
              point1.y +
              cosParam *
              (point2.y-point1.y)
            ) *
            (c.maxRad - c.minRad)
          );

          x0 = xSqueeze * rad * Math.cos(theta);
          y0 = rad*Math.sin(theta);

          this.context.lineTo(x0, y0);
        }
        this.context.closePath();
        this.context.stroke();
      }
    }
  }

  setLinePoints(iterations) {
    const lastPoint = { x: 1, y: 1 };

    let pointList = {
      first: { x: 0, y: 1, next: lastPoint },
    };

    let minY = 1;
    let maxY = 1;
    let point;

    for (let i = 0; i < iterations; i++) {
      point = pointList.first;

      while (point.next != null) {
        let nextPoint = point.next;

        let dx = nextPoint.x - point.x;
        let newX = 0.5 * (point.x + nextPoint.x);
        let newY = 0.5 * (point.y + nextPoint.y);
        newY += dx * (Math.random() * 2 - 1);

        const newPoint = { x: newX, y: newY };

        if (newY < minY) {
          minY = newY;
        } else if (newY > maxY) {
          maxY = newY;
        }

        newPoint.next = nextPoint;
        point.next = newPoint;

        point = nextPoint;
      }
    }

    if (maxY != minY) {
      const normalizeRate = 1 / (maxY - minY);
      point = pointList.first;

      while (point != null) {
        point.y = normalizeRate * (point.y - minY);
        point = point.next;
      }
    } else {
      point = pointList.first;

      while (point != null) {
        point.y = 1;
        point = point.next;
      }
    }

    return pointList;
  }

  hexToRGBA(hex, opacity) {
    hex = hex.replace('#','');

    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}

class SmokeBackground {
  constructor(_x0, _y0, _rad0, _x1, _y1, _rad1) {
    this.x0 = _x0;
    this.y0 = _y0;
    this.x1 = _x1;
    this.y1 = _y1;
    this.rad0 = _rad0;
    this.rad1 = _rad1;
    this.colorStops = [];
  }

  addColorStop(ratio, r, g, b) {
    if (ratio < 0 || ratio > 1) return;

    const newStop = { ratio, r, g, b };

    if (ratio >= 0 && ratio <= 1) {
      if (this.colorStops.length == 0) {
        this.colorStops.push(newStop);
      } else {
        const len = this.colorStops.length;
        let i = 0;
        let found = false;

        while (!found && i < len) {
          found = (ratio <= this.colorStops[i].ratio);
          if (!found) i++;
        }

        if (!found) {
          this.colorStops.push(newStop);
        } else {
          if (ratio == this.colorStops[i].ratio) {
            this.colorStops.splice(i, 1, newStop);
          } else {
            this.colorStops.splice(i, 0, newStop);
          }
        }
      }
    }
  }

  fillRect(ctx, rectX0, rectY0, rectW, rectH) {
    if (this.colorStops.length == 0) {
      return;
    }

    const image = ctx.getImageData(rectX0, rectY0, rectW, rectH);
    const pixelData = image.data;
    const len = pixelData.length;

    let nearestValue = null;
    let quantError = null;
    let x = null;
    let y = null;
    let ratio = null;

    let r, g, b;
    let r0, g0, b0, r1, g1, b1;
    let ratio0, ratio1;
    let f;
    let stopNumber;
    let found;
    let q;

    let rBuffer = [];
    let gBuffer = [];
    let bBuffer = [];
    let aBuffer = [];

    let a, c, discrim;
    let dx, dy;

    const xDiff = this.x1 - this.x0;
    const yDiff = this.y1 - this.y0;
    const rDiff = this.rad1 - this.rad0;
    const rConst1 = 2 * this.rad0 * (this.rad1 - this.rad0);
    const r0Square = this.rad0 * this.rad0;

    a = rDiff * rDiff - xDiff * xDiff - yDiff * yDiff;

    if (this.colorStops[0].ratio != 0) {
      this.colorStops.splice(0, 0, {
        ratio:0,
        ...this.colorStops[0]
      });
    }

    if (this.colorStops[this.colorStops.length - 1].ratio != 1) {
      this.colorStops.push({
        ratio:1,
        ...this.colorStops[this.colorStops.length - 1]
      });
    }

    for (let i = 0; i < len / 4; i++) {
      x = rectX0 + (i % rectW);
      y = rectY0 + Math.floor(i / rectW);

      dx = x - this.x0;
      dy = y - this.y0;
      b = rConst1 + 2 * (dx * xDiff + dy * yDiff);
      c = r0Square - dx * dx - dy * dy;
      discrim = b * b - 4 * a * c;

      if (discrim >= 0) {
        ratio = (-b + Math.sqrt(discrim)) / (2 * a);

        if (ratio < 0) {
          ratio = 0;
        } else if (ratio > 1) {
          ratio = 1;
        }

        if (ratio == 1) {
          stopNumber = this.colorStops.length-1;
        } else {
          stopNumber = 0;
          found = false;

          while (!found) {
            found = (ratio < this.colorStops[stopNumber].ratio);
            if (!found) stopNumber++;
          }
        }

        r0 = this.colorStops[stopNumber - 1].r;
        g0 = this.colorStops[stopNumber - 1].g;
        b0 = this.colorStops[stopNumber - 1].b;
        r1 = this.colorStops[stopNumber].r;
        g1 = this.colorStops[stopNumber].g;
        b1 = this.colorStops[stopNumber].b;
        ratio0 = this.colorStops[stopNumber - 1].ratio;
        ratio1 = this.colorStops[stopNumber].ratio;

        f = (ratio - ratio0) / (ratio1 - ratio0);
        r = r0 + (r1 - r0) * f;
        g = g0 + (g1 - g0) * f;
        b = b0 + (b1 - b0) * f;
      } else {
        r = r0;
        g = g0;
        b = b0;
      }

      rBuffer.push(r);
      gBuffer.push(g);
      bBuffer.push(b);
    }

    for (let i = 0; i < len / 4; i++) {
      nearestValue = ~~(rBuffer[i]);
      quantError = rBuffer[i] - nearestValue;
      rBuffer[i + 1] += 7 / 16 * quantError;
      rBuffer[i - 1 + rectW] += 3 / 16 * quantError;
      rBuffer[i + rectW] += 5 / 16 * quantError;
      rBuffer[i + 1 + rectW] += 1 / 16 * quantError;

      nearestValue = ~~(gBuffer[i]);
      quantError =gBuffer[i] - nearestValue;
      gBuffer[i + 1] += 7 / 16 * quantError;
      gBuffer[i - 1 + rectW] += 3 / 16 * quantError;
      gBuffer[i + rectW] += 5 / 16 * quantError;
      gBuffer[i + 1 + rectW] += 1 / 16 * quantError;

      nearestValue = ~~(bBuffer[i]);
      quantError = bBuffer[i] - nearestValue;
      bBuffer[i + 1] += 7 / 16 * quantError;
      bBuffer[i - 1 + rectW] += 3 / 16 * quantError;
      bBuffer[i + rectW] += 5 / 16 * quantError;
      bBuffer[i + 1 + rectW] += 1 / 16 * quantError;
    }

    for (let i = 0; i < len; i += 4) {
      q = i / 4;
      pixelData[i] = ~~rBuffer[q];
      pixelData[i + 1] = ~~gBuffer[q];
      pixelData[i + 2 ] = ~~bBuffer[q];
      pixelData[i + 3] = 255;
    }

    ctx.putImageData(image, rectX0, rectY0);
  }
}
