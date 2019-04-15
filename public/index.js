/* eslint-disable semi */
'use srict';
const defaultFill = '#FFFFFF';
const darkGrey = '#5D5D5D';
const red = '#EF4628';
const minD = 10;
const maxD = 50;
const windowHeightOffset = 50;
const windowWidthOffset = 32;
const fps = 60;

var gameLoop; // magic happens here
var meteorList = []; // array for meteors
var curSpeed = getSpeed();
var ctx = document.getElementById('canvas').getContext('2d');
var play = true;
var rent = 0.0;

// basic set up
ctx.canvas.height = (document.documentElement.clientHeight - windowHeightOffset) / 2;
ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset;
ctx.fillStyle = defaultFill;
ctx.font = '24px Montserrat';

// avatar placeholder
var otm = {
  x: (ctx.canvas.width / 2),
  y: (ctx.canvas.height - 50),
  h: 50,
  w: 50
}

// y = -1 / 10 x + 11
function updateRent (num) {
  rent += num;
  document.getElementById('rent-money').innerHTML = rent;
}

// use between [10, 50]
function getRandomIntInclusive (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// adjusted for 60fps
function getSpeed () {
  let speed = document.getElementById('slider').value;
  return parseInt(speed, 10) / fps;
}

function clearRect () {
  ctx.fillStyle = darkGrey;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawOtm (x, y) {
  ctx.fillStyle = red;
  ctx.fillRect(otm.x, otm.y, otm.w, otm.h);
}

function didMeteorCollide (meteor1, meteor2) {
  let xDist = Math.abs(meteor2.x - meteor1.x);
  let yDist = Math.abs(Math.abs(meteor2.y) - Math.abs(meteor1.y));

  let rSum = meteor1.r + meteor2.r;

  // compare distances a^2 + b^2 <= c^2
  if (Math.pow(xDist, 2) + Math.pow(yDist, 2) <= Math.pow(rSum, 2)) {
    return true;
  } else {
    return false;
  }
}

function didClickMeteor (click, meteor) {
  let a = Math.abs(click.offsetX - meteor.x);
  let b = Math.abs(click.offsetY - meteor.y);
  let r = meteor.r;
  return Math.pow(a, 2) + Math.pow(b, 2) <= Math.pow(r, 2);
}

function removeMeteor (i) {
  meteorList.splice(i, 1);
}

function createMeteor () {
  let tempR = getRandomIntInclusive(minD, maxD);
  // radius is my offset so meteors aren't half off the screen
  let tempX = getRandomIntInclusive(tempR, ctx.canvas.width - tempR);
  let tempY = -tempR;

  let tempMeteor = {
    x: tempX,
    y: tempY,
    r: tempR,
    draw: function (num) {
      //draw the meteor
      ctx.fillStyle = defaultFill;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // write a number for testing
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.fillText(((-1 / 10) * (this.r * 2) + 11).toFixed(2), this.x, this.y);
    },
    getValue: function () {
      return ((-1 / 10) * (this.r * 2) + 11).toFixed(2);
    }
  };

  // don't put meteors on top of one another
  for (let i = 0; i < meteorList.length; i++) {
    // still entering the canvas and a collision
    if ((meteorList[i].y < meteorList[i].r) && didMeteorCollide(tempMeteor, meteorList[i])) {
      // move it up a bit
      tempMeteor.y -= tempMeteor.r + meteorList[i].r;
    }
  }
  return tempMeteor;
}

// takes a value between 10-100
function moveMeteors (fallRate) {
  for (let i = 0; i < meteorList.length; i++) {
    meteorList[i].y += fallRate;
    meteorList[i].draw(i);

    // if it hits the bottom
    if ((meteorList[i].y + meteorList[i].r) >= ctx.canvas.height) {
      removeMeteor(i);
    }
  }
}

meteorList.push(createMeteor());
meteorList.push(createMeteor());
meteorList.push(createMeteor());
meteorList.push(createMeteor());

gameLoop = function () {
  // reset the canvas
  clearRect();
  // draw the hero
  drawOtm();
  // increments all meteors then draws them, removes when they touch the bottom
  moveMeteors(getSpeed());

  // window.requestAnimationFrame(gameLoop);
};

// event listeners
window.addEventListener('click', function (e) {
  for (let i = 0; i < meteorList.length; i++) {
    if (didClickMeteor(e, meteorList[i])) {
      removeMeteor(i);
      console.log(rent);
      updateRent(meteorList[i].getValue());
    }
  }
});
var game = setInterval(gameLoop, 1000 / fps);
// var meteorInterval = setInterval(meteorList.push(createMeteor()), 1000);
