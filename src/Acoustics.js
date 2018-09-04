import _ from 'lodash'
import Interp from './Interp'

const { Point, Log } = Interp

const format = (num) => Math.round(num)

const K_FACTOR = 0.161

// Target RT60 values recommended by DIN18041 standard for depending on room usage
// A1 - Music
// A2 - Speech / Presentation
// A3 - Education / Communication
// A4 - Education / Communication Inclusive
// A5 - Sport
const OPTIMAL_RT60 = {
  A1: {
    start: new Point(30, .73),
    end: new Point(30000, 2.1),
  },
  A2: {
    start: new Point(30, .42),
    end: new Point(30000, 1.52),
  },
  A3: {
    start: new Point(30, .3),
    end: new Point(30000, 1.27),
  },
  A4: {
    start: new Point(30, .25),
    end: new Point(30000, 1.05),
  },
  A5: {
    start: new Point(100, .5),
    end: new Point(10000, 2),
  },
}

class Acoustics {
  static RT60 = (V, A) => K_FACTOR * V / A

  static A = (V, T) => K_FACTOR * V / T

  static A_eq = (alpha, S) => alpha * S

  static alpha = (A_eq, S) => A_eq / S

  static getTargetRT60 = (type, V) => {
    if (!type || !OPTIMAL_RT60[type]) return null
    const { start, end } = OPTIMAL_RT60[type]
    try {
      const log = new Log(start, end)
      return _.round(log.interp(Number(V)), 2)
    } catch (e) {
      return null
    }
  }

  static surfaceAreas = (dimensions) => {
    const width = dimensions.width / 100
    const height = dimensions.height / 100
    const length = dimensions.length / 100

    if (!width || !length || !height) return {}

    const ceiling = width * length
    const floor = ceiling
    const walls = (width * height * 2) + (length * height * 2)
    const total = ceiling + floor + walls
    const results = { ceiling, floor, walls, total }
    _.each(results, (num, key) => results[key] = _.round(num, 2))

    return results
  }

  static volume = (dimensions) => {
    const width = dimensions.width / 100
    const height = dimensions.height / 100
    const length = dimensions.length / 100

    if (!width || !length || !height) return null

    return (width * length * height).toFixed(2)
  }

  // Reverberation time RT60 = 0.161 · V / A (V and A in meter)
  // A0 = 0.161 · V / RT60
  static A_eqs = (RT60Data, V) => {
    if (_.isEmpty(RT60Data) || !V) return {}

    let A_eq = {}

    _.each(RT60Data, data => {
      const { frequency, RT60: T } = data
      const A = Acoustics.A(V, T)
      A_eq[frequency] = _.round(A, 2)
    })

    return A_eq
  }

  static alphas = (A_eq, S) => {
    if (_.isEmpty(A_eq) || !S) return {}

    let alpha = {}

    _.each(A_eq, (A, hz) => {
      alpha[hz] = _.round(A / S, 3)
    })

    return alpha
  }

  static A_adds = (A_eqs, RT60s, alphas, T_opt, V) => {
    if (_.isEmpty(A_eqs) || _.isEmpty(alphas) || _.isEmpty(RT60s) || !T_opt) return {}

    let A_adds = {}

    _.each(RT60s, ({ frequency, RT60: T }) => {
      const A_0 = A_eqs[frequency]
      const A_req = Acoustics.A(V, T_opt)
      const A_add = A_req - A_0
      A_adds[frequency] = _.round(A_add)
    })

    return A_adds
  }
}

export default Acoustics
