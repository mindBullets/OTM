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
      for (let i = 0; i < this.length(); i++) {
        this.meteors[i].y += fallRate
      }
    }
  }

  addMeteor (meteor) {
    if (this.length() > 0) {
      // don't put meteors on top of one another
      for (let i = 0; i < this.length(); i++) {
        // only check meteors not in the canvas yet
        if ((this.meteors[i].y < this.meteors[i].r) && meteor.didCollide(this.meteors[i])) {
          // move it up a bit
          meteor.y -= 2 * meteor.r + 2 * this.meteors[i].r
        }
      }
    }
    this.meteors.push(meteor)
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
    this.ctx.fillStyle = darkGrey
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
    this.ctx.fillText(parseFloat(meteor.getValue()).toFixed(2), meteor.x, meteor.y)
  }

  drawAllMeteors (list) {
    for (let i = 0; i < list.length(); i++) {
      this.drawMeteor(list.meteors[i])
    }
  }

  getSpeed (myFps) {
    let speed = document.getElementById('slider').value
    return parseInt(speed, 10) / myFps
  }
}

// function resizeCanvas () {
//   if (document.documentElement.clientWidth - windowWidthOffset > 1200) {
//     ctx.canvas.width = 1200
//   } else {
//     // full height
//     ctx.canvas.height = (document.documentElement.clientHeight - windowHeightOffset) * 0.75
//     ctx.canvas.width = document.documentElement.clientWidth - windowWidthOffset
//   }
// }

// y = -1 / 10 x + 11
// function updateRent (num) {
//   rent += parseFloat(num)
//   document.getElementById('rent-money').innerHTML = rent.toFixed(2)
// }

// use between [10, 50]

// adjusted for 60fps
// function getSpeed () {
//   let speed = document.getElementById('slider').value
//   return parseInt(speed, 10) / fps
// }

// function clearRect () {
//   ctx.fillStyle = darkGrey
//   ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
// }

// function drawOtm (x, y) {
//   ctx.fillStyle = red
//   ctx.fillRect(x, y, otm.w, otm.h)
// }

// function didCollide (meteor1, meteor2) {
//   let xDist = Math.abs(meteor2.x - meteor1.x)
//   let yDist = Math.abs(Math.abs(meteor2.y) - Math.abs(meteor1.y))

//   let rSum = meteor1.r + meteor2.r

//   // compare distances a^2 + b^2 <= c^2
//   if (Math.pow(xDist, 2) + Math.pow(yDist, 2) <= Math.pow(rSum, 2)) {
//     return true
//   } else {
//     return false
//   }
// }

// function didClick (click, meteor) {
//   let a = Math.abs(click.offsetX - meteor.x)
//   let b = Math.abs(click.offsetY - meteor.y)
//   let r = meteor.r
//   return Math.pow(a, 2) + Math.pow(b, 2) <= Math.pow(r, 2)
// }

// function removeMeteor (i) {
//   meteorList.splice(i, 1)
// }

// function createMeteor () {
//   let tempR = getRandomIntInclusive(minD, maxD)
//   // radius is my offset so meteors aren't half off the screen
//   let tempX = getRandomIntInclusive(tempR, ctx.canvas.width - tempR)
//   let tempY = -tempR

//   let tempMeteor = {
//     x: tempX,
//     y: tempY,
//     r: tempR,
//     // draw: function (num) {
//     //   // draw the meteor
//     //   ctx.fillStyle = defaultFill
//     //   ctx.beginPath()
//     //   ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
//     //   ctx.fill()
//     //   ctx.stroke()
//     //   // write a number for testing
//     //   ctx.fillStyle = 'red'
//     //   ctx.textAlign = 'center'
//     //   ctx.fillText(((-1 / 10) * (this.r * 2) + 11).toFixed(2), this.x, this.y)
//     }
//     // getValue: function () {
//     //   return ((-1 / 10) * (this.r * 2) + 11).toFixed(2)
//     // }
//   }

// //CONTROLLER CODE
// // don't put meteors on top of one another
// for (let i = 0; i < meteorList.length; i++) {
//   // still entering the canvas and a collision
//   if ((meteorList[i].y < meteorList[i].r) && didCollide(tempMeteor, meteorList[i])) {
//     // move it up a bit
//     tempMeteor.y -= 2 * tempMeteor.r + 2 * meteorList[i].r
//   }
// }
// return tempMeteor

// takes a value between 10-100
// function moveMeteors (fallRate) {
//   for (let i = 0; i < meteorList.length; i++) {
//     meteorList[i].y += fallRate
//     meteorList[i].draw(i)

//     // if it hits the bottom
//     if ((meteorList[i].y + meteorList[i].r) >= ctx.canvas.height) {
//       removeMeteor(i)
//     }
//   }
// }

// radius is my offset so meteors aren't half off the screen
// let tempR = getRandomIntInclusive(minD, maxD)
// let tempX = getRandomIntInclusive(tempR, ctx.canvas.width - tempR)
// let tempY = -tempR

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// set up the loop
var myView = new View(document.getElementById('canvas'))
var otm = new OneTapMap(myView.ctx.canvas.width - 25, myView.ctx.canvas.height - 50, 50, 50)
var myMeteors = new MeteorList()
var animationId = null

function gameLoop () {
  tNow = window.performance.now()
  // 1 meteor/second
  if (tNow - tLastMeteor >= meteorLength) {
    let r = getRandomIntInclusive(minD, maxD)
    let x = getRandomIntInclusive(r, myView.ctx.canvas.width - r)
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
    // draw the hero
    myView.drawOtm((myView.ctx.canvas.width / 2), (myView.ctx.canvas.height - 50), otm)
    // increments all meteors then draws them, removes when they touch the bottom
    myMeteors.moveMeteors(myView.getSpeed(fps))
    myView.drawAllMeteors(myMeteors)
  }
};

window.addEventListener('load', function () {
  myView.resizeCanvas()
  myView.clearRect()
  window.requestAnimationFrame(gameLoop)
})

playPause.addEventListener('click', function () {
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
  console.log(e.offsetX)
  // console.log(e.offsetY)
  if (myMeteors.length() > 0) {
    for (let i = 0; i < myMeteors.length(); i++) {
      if (myMeteors.meteors[i].didClick(e)) {
        otm.updateRent(myMeteors.meteors[i].getValue())
        myMeteors.removeMeteor(i)
      }
    }
  }
})

// adjust the canvas on resize
window.addEventListener('resize', function () {
  myView.resizeCanvas()
  myView.clearRect()
  myView.drawOtm((myView.ctx.canvas.width / 2), (myView.ctx.canvas.height - 50), otm)
})
