import { Component } from 'react'
import { debounce } from 'lodash'
import { isEqual } from 'lodash'

export class Persist extends Component {
  static defaultProps = {
    debounce: 300,
  }

  persist = debounce((data) => {
    window.localStorage.setItem(this.props.name, JSON.stringify(data))
  }, this.props.debounce)

  componentWillReceiveProps({ name, data }) {
    if (name !== this.props.name) {
      const data = window.localStorage.getItem(name)
      this.props.onData(JSON.parse(data))
    }
    if (!isEqual(data, this.props.data)) {
      this.persist(data)
    }
  }

  componentDidMount() {
    const data = window.localStorage.getItem(this.props.name)
    if (data && data !== null) {
      this.props.onData(JSON.parse(data))
    }
  }

  render() {
    return null
  }
}
