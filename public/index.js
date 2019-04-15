/* eslint-disable semi */
'use srict';
const defaultFill = '#FFFFFF';
const darkGrey = '#5D5D5D';
const red = '#EF4628';
const minD = 10;
const maxD = 50;
const windowHeightOffset = 50;
const windowWidthOffset = 32;

var gameLoop; // magic happens here
var meteorList = []; // array for meteors
var curSpeed = getSpeed();
var ctx = document.getElementById('canvas').getContext('2d');

// basic set up
ctx.canvas.height = document.documentElement.clientHeight - windowHeightOffset;
ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset;
ctx.fillStyle = defaultFill;

var otm = {
  x: (ctx.canvas.width / 2),
  y: (ctx.canvas.height - 50),
  h: 50,
  w: 50
}

// use between [10, 50]
function getRandomIntInclusive (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSpeed () {
  let speed = document.getElementById('slider').value;
  return parseInt(speed, 10);
}

function drawCanvas () {
  ctx.fillStyle = darkGrey;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawOtm(x, y) {
  ctx.fillStyle = red;
  ctx.fillRect(otm.x, otm.y, otm.w, otm.h);
}

function makeMeteor () {
  let tempR = getRandomIntInclusive(minD, maxD);

  // radius is my offset so meteors aren't half off the screen
  let tempX = getRandomIntInclusive(tempR, ctx.canvas.width - tempR);
  let tempY = -tempR; // just for testing. later make this -tempR
  var tempMeteor = {
    x: tempX,
    y: tempY,
    r: tempR,
    draw: function () {
      ctx.fillStyle = defaultFill;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };
  return tempMeteor;
}

// takes a value between 10-100
function moveMeteors (fallRate) {
  for (let i = 0; i < meteorList.length; i++) {
    meteorList[i].y += fallRate;
    meteorList[i].draw();
    if ((meteorList[i].y + meteorList[i].r) >= ctx.canvas.height) {
      meteorList.splice(i, 1);
    }
  }
}

gameLoop = function () {
  // reset the canvas
  drawCanvas();
  // draw the hero
  drawOtm();
  // increments all meteors then draws them, removes when they touch the bottom
  moveMeteors(getSpeed());
  setInterval(meteorList.push(makeMeteor()), 1000);

  window.requestAnimationFrame(gameLoop);
};

// event listeners
window.addEventListener('mousemove', function (e) {
  console.log(`x: ${e.x}`);
});

window.requestAnimationFrame(gameLoop);
