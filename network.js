/* eslint no-redeclare: 0 */
/* eslint no-unused-vars: 0 */

/*
Network
Made by Branson Camp 10/29/18
*/

function dot (v1, v2) {
  // console.log(`Dotting ${v1} and ${v2}`)
  if (v1.length !== v2.length) {
    throw new Error('Vectors must be of equal length for dot product')
  }

  var sum = 0
  for (var i = 0; i < v1.length; i++) {
    sum += v1[i] * v2[i]
  }

  return sum
}

function randFloat (min, max) {
  return Math.random() * (max - min) + min
}

function randInt (min, max) {
  return Math.floor(randFloat(min, max))
}

function sig (x) {
  return 1 / (1 + (Math.pow(Math.E, -x)))
}

class Network {
  constructor (layerLengths) {
    this.maxNeurons = Math.max(...layerLengths)

    // Nodes: [layer][index]
    this.nodes = []
    // Weights: [startLayer][startNodeIndex][endNodeIndex]
    this.weights = []
    // Biases: [layer][nodeIndex]
    this.biases = []

    // Nodes
    for (var i = 0; i < layerLengths.length; i++) {
      this.nodes.push(new Array(layerLengths[i]).fill(0))
      this.biases.push(new Array(layerLengths[i]).fill(0))
    }

    // Weights
    for (var i = 0; i < this.nodes.length - 1; i++) {
      let currentLayer = this.nodes[i]
      let nextLayer = this.nodes[i + 1]

      // this.weights.push(new Array(currentLayer.length).fill(new Array(nextLayer.length).fill(0)))
      this.weights.push(new Array(currentLayer.length))
      for (var j = 0; j < currentLayer.length; j++) {
        this.weights[i][j] = new Array(nextLayer.length).fill(0)
      }
    }
  }

  evaluate (inputs) {
    if (this.nodes[0].length !== inputs.length) {
      throw new Error('Error, must be the same number of inputs as the first layer of network')
    }
    this.nodes[0] = inputs
    for (var i = 1; i < this.nodes.length; i++) {
      // Each Target Layer
      var lastLayer = this.nodes[i - 1]
      for (var j = 0; j < this.nodes[i].length; j++) {
        // Each Target Node
        // Target Node = dot(last layer, last weights)

        this.nodes[i][j] = dot(lastLayer, this.getTerminalWeights(i, j))
        this.nodes[i][j] += this.biases[i][j]
        this.nodes[i][j] = sig(this.nodes[i][j])
      }
    }
    return this.nodes[this.nodes.length - 1]
  }

  setWeight (startLayer, startNodeIndex, endNodeIndex, value) {
    // console.log(this.weights)
    this.weights[startLayer][startNodeIndex][endNodeIndex] = value
  }

  display (two, x, y, scale) {
    const xSpacing = 80
    const ySpacing = 50
    const circleRadius = 10

    // Weights
    for (var i = 0; i < this.weights.length; i++) {
      // Each Starting Layer
      // Start offset
      var numNeurons = this.nodes[i].length
      var layerHeight = numNeurons * ySpacing
      var maxHeight = this.maxNeurons * ySpacing
      var centerOffset = (maxHeight - layerHeight) / 2

      // End offset
      var nextNumNeurons = this.nodes[i + 1].length
      var nextLayerHeight = nextNumNeurons * ySpacing
      var nextMaxHeight = this.maxNeurons * ySpacing
      var nextCenterOffset = (nextMaxHeight - nextLayerHeight) / 2
      for (var j = 0; j < this.weights[i].length; j++) {
        // Each Starting Node
        for (var k = 0; k < this.weights[i][j].length; k++) {
          // Each Ending Node
          let startX = x + scale * (circleRadius + xSpacing * i)
          let startY = x + scale * (circleRadius + centerOffset + ySpacing * j)
          let endX = y + scale * (circleRadius + xSpacing * (i + 1))
          let endY = y + scale * (circleRadius + nextCenterOffset + ySpacing * k)
          let line = two.makeLine(startX, startY, endX, endY)
          line.linewidth = 2 * scale
          // Line colors
          var weight = this.weights[i][j][k]
          var r = 0
          var g = 0
          var b = 0
          if (weight > 0) {
            g = Math.floor(255 * weight)
          } else {
            r = Math.floor(255 * -weight)
          }
          line.stroke = `rgb(${r}, ${g}, ${b})`
        }
      }
    }

    // Nodes
    for (var i = 0; i < this.nodes.length; i++) {
      // Each Layer
      var numNeurons = this.nodes[i].length
      var layerHeight = numNeurons * ySpacing
      var maxHeight = this.maxNeurons * ySpacing
      var centerOffset = (maxHeight - layerHeight) / 2

      for (var j = 0; j < this.nodes[i].length; j++) {
        // Each Neuron
        var rect = two.makeCircle(x + scale * (circleRadius + xSpacing * i), y + scale * (circleRadius + centerOffset + ySpacing * j), scale * circleRadius)
        rect.linewidth = 1 * scale
        if (i === 0) {
          rect.fill = 'rgb(33, 228, 29)'
        } else if (i === this.nodes.length - 1) {
          rect.fill = 'orange'
        } else {
          rect.fill = 'skyblue'
        }
      }
    }
  }

  getTerminalWeights (endLayerIndex, endNodeIndex) {
    // [startLayer][startNode][endNode]
    var targetWeights = []
    var startLayerIndex = endLayerIndex - 1
    var startLayerWeights = this.weights[startLayerIndex]
    for (var i = 0; i < startLayerWeights.length; i++) {
      for (var j = 0; j < startLayerWeights[i].length; j++) {
        if (j === endNodeIndex) {
          targetWeights.push(startLayerWeights[i][j])
        }
      }
    }

    console.log(`Terminal weights for [${endLayerIndex}, ${endNodeIndex}] is ${targetWeights}`)
    return targetWeights
  }

  randomize (min, max) {
    for (var i = 0; i < this.weights.length; i++) {
      for (var j = 0; j < this.weights[i].length; j++) {
        for (var k = 0; k < this.weights[i][j].length; k++) {
          this.weights[i][j][k] = randFloat(min, max)
        }
      }
    }
  }

  mutate (num) {
    for (var i = 0; i < num; i++) {
      var startLayer = randInt(0, this.nodes.length - 1)
      var startNodeIndex = randInt(0, this.nodes[startLayer].length)
      var endNodeIndex = randInt(0, this.nodes[startLayer + 1].length)

      this.weights[startLayer][startNodeIndex][endNodeIndex] = randFloat(-1, 1)
    }
  }
}
