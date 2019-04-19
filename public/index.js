const defaultFill = '#FFFFFF'
const darkGrey = '#5D5D5D'
const red = '#EF4628'
const minD = 10
const maxD = 50
const windowHeightOffset = 50
const windowWidthOffset = 32
const fps = 60
const meteorLength = 1000 // interval for each meteor

var images = []
var playPause = document.getElementById('start')
var play = false
var tNow = window.performance.now()
var tLastUpdate = tNow
var tLastMeteor = tNow // used to time meteor creation

// avatar placeholder
class OneTapMap {
  constructor (x, y, h, w) {
    this.x = x
    this.y = x
    this.h = h
    this.w = w
    this.rent = 0
  }

  updateRent (num) {
    this.rent += parseFloat(num)
  }
}

class Meteor {
  constructor (x, y, r) {
    this.x = x
    this.y = y
    this.r = r
  }

  didClick (click) {
    let a = Math.abs(click.offsetX - this.x)
    let b = Math.abs(click.offsetY - this.y)
    let r = this.r
    return Math.pow(a, 2) + Math.pow(b, 2) <= Math.pow(r, 2)
  }

  didCollide (meteor) {
    let xDist = Math.abs(meteor.x - this.x)
    let yDist = Math.abs(Math.abs(meteor.y) - Math.abs(this.y))
    let rSum = this.r + meteor.r

    // compare distances a^2 + b^2 <= c^2
    return (Math.pow(xDist, 2) + Math.pow(yDist, 2) <= Math.pow(rSum, 2))
  }

  // y = -1 / 10 x + 11 returns a string
  getValue () {
    return parseFloat((-1 / 10) * (this.r * 2) + 11).toFixed(2)
  }
}

class MeteorList {
  constructor () {
    this.meteors = []
  }

  length () {
    return this.meteors.length
  }

  removeMeteor (i) {
    this.meteors.splice(i, 1)
  }

  moveMeteors (fallRate) {
    if (this.length() > 0) {
      this.meteors.forEach(meteor => { meteor.y += fallRate })
    }
  }

  addMeteor (newMeteor) {
    if (this.length() > 0) {
      this.meteors.forEach(m => {
        if (m.y < (m.r * 2) && newMeteor.didCollide(m)) {
          newMeteor.y -= 2 * newMeteor.r + 2 * m.r
        }
      })
    }
    this.meteors.push(newMeteor)
  }
}

class View {
  constructor (canvas) {
    this.ctx = canvas.getContext('2d')
    this.ctx.canvas.height = (document.documentElement.clientHeight - windowHeightOffset) / 2
    this.ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset
  }

  resizeCanvas () {
    if (document.documentElement.clientWidth - windowWidthOffset > 1200) {
      this.ctx.canvas.width = 1200
    } else {
      // full height
      this.ctx.canvas.height = (document.documentElement.clientHeight - windowHeightOffset) * 0.75
      this.ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset
    }
  }

  clearRect () {
    // this.ctx.fillStyle = darkGrey
    this.ctx.fillStyle = 'rgba(93, 93, 93, .9)'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  drawOtm (x, y, otm) {
    this.ctx.fillStyle = red
    this.ctx.fillRect(x, y, otm.h, otm.w)
  }

  drawRent (num) {
    document.getElementById('rent-money').innerHTML = num.toFixed(2)
  }

  drawMeteor (meteor) {
    // draw the meteor
    this.ctx.fillStyle = defaultFill
    this.ctx.beginPath()
    this.ctx.arc(meteor.x, meteor.y, meteor.r, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.stroke()
    // write a number for testing
    this.ctx.fillStyle = defaultFill
    this.ctx.font = '30px Arial'
    this.ctx.fillStyle = 'red'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('$' + parseFloat(meteor.getValue()).toFixed(2), meteor.x, meteor.y)
  }

  drawAllMeteors (list) {
    list.meteors.forEach((meteor, i) => {
      this.drawMeteor(meteor)
      if (meteor.y + meteor.r >= this.ctx.canvas.height) {
        list.removeMeteor(i)
      }
    })
  }

  getSpeed (myFps) {
    let speed = document.getElementById('slider').value
    return parseInt(speed, 10) / myFps
  }
}

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// set up the loop
var myView = new View(document.getElementById('canvas'))
var otm = new OneTapMap(myView.ctx.canvas.width - 25, myView.ctx.canvas.height - 50, 50, 50)
var myMeteors = new MeteorList()
// var animationId = null

function gameLoop () {
  tNow = window.performance.now()
  // 1 meteor/second
  if (tNow - tLastMeteor >= meteorLength) {
    let r = getRandomIntInclusive(minD, maxD)
    let x = getRandomIntInclusive(r, myView.ctx.canvas.width - r)
    // radius is my offset so meteors aren't half off the screen
    let y = -r
    let m = new Meteor(x, y, r)
    myMeteors.addMeteor(m)
    tLastMeteor = tNow
  }
  // runs at 60 fps
  if (tNow - tLastUpdate > 1000 / fps && play) {
    animationId = window.requestAnimationFrame(gameLoop)
    // reset the canvas
    myView.clearRect()
    // myView.drawBg()
    // draw the hero
    myView.drawOtm((myView.ctx.canvas.width / 2), (myView.ctx.canvas.height - 50), otm)
    // increments all meteors then draws them, removes when they touch the bottom
    myMeteors.moveMeteors(myView.getSpeed(fps))
    myView.drawAllMeteors(myMeteors)
  }
};

window.addEventListener('load', () => {
  myView.resizeCanvas()
  myView.clearRect()
  window.requestAnimationFrame(gameLoop)
})

playPause.addEventListener('click', () => {
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
window.addEventListener('click', e => {
  if (myMeteors.length() > 0 && play) {
    myMeteors.meteors.forEach((m, i) => {
      if (m.didClick(e)) {
        otm.updateRent(m.getValue())
        myView.drawRent(otm.rent)
        myMeteors.removeMeteor(i)
      }
    })
  }
})

// adjust the canvas on resize
window.addEventListener('resize', () => {
  myView.resizeCanvas()
  myView.clearRect()
  myView.drawOtm((myView.ctx.canvas.width / 2), (myView.ctx.canvas.height - 50), otm)
})
