const defaultFill = '#FFFFFF'
const darkGrey = '#5D5D5D'
const red = '#EF4628'
const minD = 10
const maxD = 50
const windowHeightOffset = 50
const windowWidthOffset = 32
const fps = 60
const meteorLength = 1000 // interval for each meteor

var playPause = document.getElementById('start')
var meteorList = [] // array for meteors
var ctx = document.getElementById('canvas').getContext('2d')
var play = false
var rent = 0
var tNow = window.performance.now()
var tLastUpdate = tNow
var tLastMeteor = tNow // used to time meteor creation

// basic set up
ctx.canvas.height = (document.documentElement.clientHeight - windowHeightOffset) / 2
ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset

ctx.fillStyle = defaultFill
ctx.font = '80px Arial'

// avatar placeholder
var otm = {
  x: (ctx.canvas.width / 2),
  y: (ctx.canvas.height - 50),
  h: 50,
  w: 50
}
function resizeCanvas () {
  if (document.documentElement.clientWidth - windowWidthOffset > 1200) {
    ctx.canvas.width = 1200
  } else {
    // full height
    ctx.canvas.height = (document.documentElement.clientHeight - windowHeightOffset) * 0.75
    ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset
  }
}

// y = -1 / 10 x + 11
function updateRent (num) {
  rent += parseFloat(num)
  document.getElementById('rent-money').innerHTML = rent.toFixed(2)
}

// use between [10, 50]
function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// adjusted for 60fps
function getSpeed () {
  let speed = document.getElementById('slider').value
  return parseInt(speed, 10) / fps
}

function clearRect () {
  ctx.fillStyle = darkGrey
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function drawOtm (x, y) {
  ctx.fillStyle = red
  ctx.fillRect(x, y, otm.w, otm.h)
}

function didMeteorCollide (meteor1, meteor2) {
  let xDist = Math.abs(meteor2.x - meteor1.x)
  let yDist = Math.abs(Math.abs(meteor2.y) - Math.abs(meteor1.y))

  let rSum = meteor1.r + meteor2.r

  // compare distances a^2 + b^2 <= c^2
  if (Math.pow(xDist, 2) + Math.pow(yDist, 2) <= Math.pow(rSum, 2)) {
    return true
  } else {
    return false
  }
}

function didClickMeteor (click, meteor) {
  let a = Math.abs(click.offsetX - meteor.x)
  let b = Math.abs(click.offsetY - meteor.y)
  let r = meteor.r
  return Math.pow(a, 2) + Math.pow(b, 2) <= Math.pow(r, 2)
}

function removeMeteor (i) {
  meteorList.splice(i, 1)
}

function createMeteor () {
  let tempR = getRandomIntInclusive(minD, maxD)
  // radius is my offset so meteors aren't half off the screen
  let tempX = getRandomIntInclusive(tempR, ctx.canvas.width - tempR)
  let tempY = -tempR

  let tempMeteor = {
    x: tempX,
    y: tempY,
    r: tempR,
    draw: function (num) {
      // draw the meteor
      ctx.fillStyle = defaultFill
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // write a number for testing
      ctx.fillStyle = 'red'
      ctx.textAlign = 'center'
      ctx.fillText(((-1 / 10) * (this.r * 2) + 11).toFixed(2), this.x, this.y)
    },
    getValue: function () {
      return ((-1 / 10) * (this.r * 2) + 11).toFixed(2)
    }
  }

  // don't put meteors on top of one another
  for (let i = 0; i < meteorList.length; i++) {
    // still entering the canvas and a collision
    if ((meteorList[i].y < meteorList[i].r) && didMeteorCollide(tempMeteor, meteorList[i])) {
      // move it up a bit
      tempMeteor.y -= 2 * tempMeteor.r + 2 * meteorList[i].r
    }
  }
  return tempMeteor
}

// takes a value between 10-100
function moveMeteors (fallRate) {
  for (let i = 0; i < meteorList.length; i++) {
    meteorList[i].y += fallRate
    meteorList[i].draw(i)

    // if it hits the bottom
    if ((meteorList[i].y + meteorList[i].r) >= ctx.canvas.height) {
      removeMeteor(i)
    }
  }
}

function gameLoop () {
  tNow = window.performance.now()
  // 1 meteor/second
  if (tNow - tLastMeteor >= meteorLength) {
    meteorList.push(createMeteor())
    tLastMeteor = tNow
  }
  // runs at 60 fps
  if (tNow - tLastUpdate > 1000 / fps && play) {
    window.requestAnimationFrame(gameLoop)
    // reset the canvas
    clearRect()
    // draw the hero
    drawOtm((ctx.canvas.width / 2), (ctx.canvas.height - 50))
    // increments all meteors then draws them, removes when they touch the bottom
    moveMeteors(getSpeed())
  }
};

window.addEventListener('load', function () {
  resizeCanvas()
  clearRect()
  window.requestAnimationFrame(gameLoop)
})
playPause.addEventListener('click', function () {
  console.log(`play ${play}`)
  if (play) {
    play = false
    playPause.innerHTML = 'Play'
  } else {
    play = true
    playPause.innerHTML = 'Pause'
    window.requestAnimationFrame(gameLoop)
  }
})

// event listeners
window.addEventListener('click', function (e) {
  for (let i = 0; i < meteorList.length; i++) {
    if (didClickMeteor(e, meteorList[i])) {
      updateRent(meteorList[i].getValue())
      removeMeteor(i)
    }
  }
})

// adjust the canvas on resize
window.addEventListener('resize', function () {
  resizeCanvas()
  drawOtm((ctx.canvas.width / 2), (ctx.canvas.height - 50))
})
window.onresize = resizeCanvas
// var game = setInterval(gameLoop, 1000 / fps)