const defaultFill = '#FFFFFF'
const black = '#000000'
const red = '#EF4628'
const minD = 10
const maxD = 50
const windowHeightOffset = 50
const windowWidthOffset = 32
const bgHeight = 675
const bgWidth = 1200
const fps = 60
const meteorLength = 1000 // interval for each meteor

var playPause = document.getElementById('start')
var play = false
var tNow = window.performance.now()
var tLastUpdate = tNow
var tLastMeteor = tNow // used to time meteor creation
var meteorSprite = new Image()
var sfbg = new Image()
var punch = new Image()
var punchSound = new Audio()

punchSound.src = '../audio/punchSound.mp3'
meteorSprite.src = '../images/meteor.png'
sfbg.src = '../images/skybg.gif'
punch.src = '../images/punch.png'

var punchSprite = {
  // [punch right, punch left]
  frame_sets: [[0, 1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6]],
  image: punch
}

class OneTapMap {
  // default h and w is the size of one sprite
  constructor (x, y, h = 61, w = 69) {
    this.x = x
    this.y = x
    this.h = h
    this.w = w
    this.rent = 0
    this.animation = new Animation(0, 2)
  }

  updateRent (num) {
    this.rent += parseFloat(num)
  }
}

class Animation {
  constructor (frameSet, delay) {
    this.delay = delay
    this.cycleCount = 0 // game cycles that have past since the last frame change
    this.frameSet = frameSet // selects a row in the spritesheet
    this.frameIndex = 0
    this.spriteFrame = 0 // sprite to display
    this.isPunching = false
    this.canDestroyMeteor = false
  }

  // switches between left and right versions of the same animation
  changeAnimationTo (frameSet, newDelay = 2) {
    if (this.frameSet !== frameSet) {
      this.delay = newDelay
      this.cycleCount = 0
      this.frameSet = frameSet
      this.frameIndex = 0 // [0 - 7] in this case
      this.spriteFrame = this.frameSet[this.frameIndex]
    }
  }

  // update
  update () {
    this.cycleCount++
    if (this.cycleCount >= this.delay) {
      this.cycleCount = 0 // reset count
      if (this.frameIndex <= this.frameSet.length - 1) {
        this.frameIndex++
      } else {
        this.frameIndex = 0 // reset the frame and stop punching
        this.isPunching = false
        this.canDestroyMeteor = true
      }
      this.spriteFrame = this.frameSet[this.frameIndex]
    }
  }
}

class Meteor {
  constructor (x, y, r, sprite) {
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
    // compare distances a^2 + b^2 < c^2
    return (Math.pow(xDist, 2) + Math.pow(yDist, 2) < Math.pow(rSum, 2))
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
    this.i = null
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
    let cHeight = document.documentElement.clientHeight
    let cWidth = document.documentElement.clientWidth
    if (cWidth > bgWidth && cHeight > bgHeight) {
      // width > 1200 and height > 675 both are bigger than max bg dimensions
      this.ctx.canvas.width = bgWidth
      this.ctx.canvas.height = bgHeight
    } else if (cWidth > bgWidth && cHeight <= bgHeight) {
      // width > 1200 and height <= 675 wide and short
      this.ctx.canvas.width = bgWidth
      this.ctx.canvas.height = cHeight - windowHeightOffset
    } else if (cWidth < bgWidth && cHeight >= bgHeight) {
      // width < 1200 and height <= 675 skinny and tall
      this.ctx.canvas.width = cWidth - windowWidthOffset
      this.ctx.canvas.height = bgHeight
    } else {
      // width < 1200 and height < 675 skinny and short
      this.ctx.canvas.width = cWidth - windowWidthOffset
      this.ctx.canvas.height = cHeight
    }
  }

  clearRect () {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 1)'
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  drawOtm (x, y, otm) {
    this.ctx.fillStyle = red
    this.ctx.fillRect(x, y, otm.h, otm.w)
  }

  drawBg () {
    this.ctx.drawImage(sfbg, 0, 0)
  }

  drawRent (num) {
    this.ctx.font = '28px Arial'
    this.ctx.fillStyle = defaultFill
    this.ctx.textAlign = 'left'
    this.ctx.shadowOffsetY = 5
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowBlur = 8
    this.ctx.shadowColor = black
    this.ctx.fillText('Money: $' + num.toFixed(2), windowWidthOffset, this.ctx.canvas.height - windowHeightOffset)
  }

  drawMeteor (meteor) {
    // draw the hurtbox
    this.ctx.fillStyle = defaultFill
    this.ctx.beginPath()
    this.ctx.arc(meteor.x, meteor.y, meteor.r, 0, Math.PI * 2)
    // draw meteor
    this.ctx.drawImage(meteorSprite, meteor.x - meteor.r, meteor.y - meteor.r, meteor.r * 2, meteor.r * 2)
    // write a number
    this.ctx.font = '16px Arial'
    this.ctx.fillStyle = defaultFill
    this.ctx.textAlign = 'center'
    this.ctx.shadowOffsetY = 5
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowBlur = 8
    this.ctx.shadowColor = black
    this.ctx.fillText('$' + parseFloat(meteor.getValue()).toFixed(2), meteor.x, meteor.y + meteor.r + 30)
  }

  drawAllMeteors (list) {
    list.meteors.forEach((meteor, i) => {
      this.drawMeteor(meteor)
      this.ctx.font = '16px Arial'
      this.ctx.fillStyle = defaultFill
      this.ctx.textAlign = 'center'
      this.ctx.shadowOffsetY = 5
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowBlur = 8
      this.ctx.shadowColor = black

      /* let the meteor go completely off the screen. to give users a chance
      to click allow for some extra time to let the punch animation finish */
      if (meteor.y - (meteor.r * 4) >= this.ctx.canvas.height) {
        list.removeMeteor(i)
      }
    })
  }

  getSpeed (myFps) {
    let speed = document.getElementById('slider').value
    return parseInt(speed, 10) / myFps
  }
}

// helper
function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// set up the loop
const myView = new View(document.getElementById('canvas'))
const otm = new OneTapMap(myView.ctx.canvas.width - 25, myView.ctx.canvas.height - 50)
const myMeteors = new MeteorList()
var tempPunchX = 0
var tempPunchY = 0
var tempPunchR = 0
var tempIndex = 0

/* --------------------- */
/* -----Game Loop------- */
/* --------------------- */
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
    window.requestAnimationFrame(gameLoop)
    // reset the canvas
    myView.clearRect()
    myView.drawBg()
    myView.drawRent(otm.rent)
    // draw the hero
    if (otm.animation.isPunching) {
      tempPunchX = myMeteors.meteors[tempIndex].x
      tempPunchY = myMeteors.meteors[tempIndex].y
      tempPunchR = myMeteors.meteors[tempIndex].r
      // draw the punch
      myView.ctx.drawImage(punchSprite.image, otm.animation.frameIndex * otm.w, 0, otm.w, otm.h, tempPunchX - (tempPunchR + otm.w - 5), tempPunchY - 20, otm.w, otm.h)
      otm.animation.update()
      punchSound.play()
      if (otm.animation.canDestroyMeteor && tempIndex !== undefined) {
        myMeteors.removeMeteor(tempIndex)
        otm.animation.canDestroyMeteor = false
      }
    }
    // increments all meteors then draws them, removes when they touch the bottom
    myMeteors.moveMeteors(myView.getSpeed(fps))
    myView.drawAllMeteors(myMeteors)
  }
};

/* --------------------- */
/* -----Listeners------- */
/* --------------------- */
window.addEventListener('load', () => {
  myView.resizeCanvas()
  myView.drawBg()
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

window.addEventListener('click', e => {
  if (myMeteors.length() > 0 && play) {
    for (let i = 0; i < myMeteors.length(); i++) {
      if (myMeteors.meteors[i].didClick(e)) {
        otm.updateRent(myMeteors.meteors[i].getValue())
        myView.drawRent(otm.rent)
        otm.animation.isPunching = true
        otm.animation.changeAnimationTo(punchSprite.frame_sets[0])
        otm.x = e.offsetX
        otm.y = e.offsetY
        tempIndex = i
        break
      }
    }
  }
})

window.addEventListener('resize', () => {
  myView.resizeCanvas()
  myView.clearRect()
  myView.drawBg()
})
