import _ from 'lodash'
import Interp from './Interp'
import { getFrequencyDomain } from './helpers'

const FrequencyDomain = getFrequencyDomain()

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

  static getRT60Tolerances = (T) => {
    const RT60Tolerances = {}
    const tolerances = {
        63: [.5, 1.7],
       125: [.65, 1.45],
       250: [.8, 1.2],
       500: [.8, 1.2],
      1000: [.8, 1.2],
      2000: [.8, 1.2],
      4000: [.65, 1.2],
      8000: [.5, 1.2],
    }
    _.map(tolerances, (t, hz) => RT60Tolerances[hz] = [t[0] * T, t[1] * T])

    return RT60Tolerances
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

  static A_eq_absorbers = (absorbers) => {
    let A_eq = {}

    _.map(FrequencyDomain, hz => {
      const totalEqAbsorptionAtFrequency = _.reduce(absorbers, (sum, absorber) => {
        const { width, height, coefficients } = absorber
        if (!width || !height || !coefficients) return sum
        const alpha = coefficients[hz] || 0
        const S = (width / 100) * (height / 100)
        const A_eq = Acoustics.A_eq(alpha, S)
        return sum + A_eq
      }, 0)

      A_eq[hz] = _.round(totalEqAbsorptionAtFrequency, 2)
    })

    return A_eq
  }

  static effectiveRT60 = (A_eqs, A_eq_absorbers, volume) => {
    let RT60s = {}

    _.map(FrequencyDomain, hz => {
      const A_eq_add = A_eq_absorbers[hz]
      const A_eq_final = A_eqs[hz] + A_eq_add
      const newRT60 = Acoustics.RT60(volume, A_eq_final)
      RT60s[hz] = _.round(newRT60, 2)
    })

    return RT60s
  }
}

export default Acoustics
