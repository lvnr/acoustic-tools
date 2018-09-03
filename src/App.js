import React, { Component } from 'react'
import { Layout, Row, Col, Input, InputNumber, Radio, Switch, Icon } from 'antd'
import { Persist } from 'react-persist'
import { VictoryArea, VictoryChart, VictoryAxis } from 'victory'
import Acoustics from './Acoustics'
import './App.css'

const { Content } = Layout

const FrequencyDomain = [63, 125, 250, 500, 1000, 2000, 4000, 8000]

class App extends Component {
  state = {
    length: 600,
    width: 400,
    height: 310,
    RT60Target: null,
    customRT60Target: true,
    measuredRT60: { 63: null, 125: null, 250: null, 500: null, 1000: null, 2000: null, 4000: null, 8000: null },
  }

  handleCustomRT60Target = (checked) => {
    this.setState({ customRT60Target: checked })
  }

  handleCustomRT60TargetInput = (value) => {
    this.setState({ RT60Target: value })
  }

  handleInput = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  handleMeasuredRT60Input = (e) => {
    this.setState({ measuredRT60: { ...this.state.measuredRT60, [e.target.name]: e.target.value } })
  }

  render() {
    const { width, length, height } = this.state
    const dimensions = { width, length, height }

    const surfaceAreas = Acoustics.surfaceAreas(dimensions)
    const volume = Acoustics.volume(dimensions)
    const measuredRT60Data = FrequencyDomain.map(hz => ({ frequency: hz, RT60: Number(this.state.measuredRT60[hz]) }))
    const A_eqs = Acoustics.A_eqs(measuredRT60Data, volume)
    const alphas = Acoustics.alphas(A_eqs, surfaceAreas.total)
    const A_adds = Acoustics.A_adds(A_eqs, measuredRT60Data, alphas, this.state['RT60Target'], volume)

    return (
      <div className="App">
        <Persist
          name="room-data"
          data={this.state}
          debounce={500}
          onMount={data => this.setState(data)}
        />

        <Row type="flex" gutter={16} style={{ padding: '32px 32px 0 32px' }}>
          <span>Room Dimensions</span>
        </Row>

        <Row type="flex" gutter={16} style={{ padding: '32px' }}>
          <Col span={6}>
            <Input
              name="length"
              size="large"
              placeholder="length (cm)"
              onChange={this.handleInput}
              value={this.state.length}
            />
            <Input
              name="width"
              size="large"
              placeholder="width (cm)"
              onChange={this.handleInput}
              value={this.state.width}
            />
            <Input
              name="height"
              size="large"
              placeholder="height (cm)"
              onChange={this.handleInput}
              value={this.state.height}
            />
          </Col>
        </Row>

        <div className="divider" />

        <Row type="flex" gutter={16} style={{ padding: '32px 32px 0 32px' }}>
          <span>Measured Reverberation Times - RT60 (s)</span>
        </Row>

        <Row type="flex" gutter={16} style={{ padding: '32px 32px 0 32px' }}>
          <VictoryChart
            height={200}
            width={400}
          >
            <VictoryAxis
              tickValues={FrequencyDomain}
              scale={{ x: 'log', y: 'linear' }}
            />
            <VictoryAxis dependentAxis />
            <VictoryArea
              // interpolation="natural"
              x="frequency"
              y="RT60"
              domain={{ x: [63, 8000] }}
              data={measuredRT60Data}
            />
          </VictoryChart>
        </Row>

        <Row type="flex" gutter={16} style={{ textAlign: 'center' }}>
          <Col span={8}> </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz}>
              <strong>{hz}</strong>Hz
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16} style={{ paddingTop: '32px' }}>
          <Col span={8} style={{ paddingTop: '8px' }}>
            <strong>Measured Reverberation Times</strong> (RT60 / s)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz}>
              <Input
                name={hz}
                size="large"
                placeholder={hz}
                onChange={this.handleMeasuredRT60Input}
                value={this.state.measuredRT60[hz]}
                style={{ textAlign: 'center' }}
              />
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16}>
          <Col span={8} className="grid-first-col">
            <strong>Equivalent Absorption Areas</strong> &nbsp; (Aeq / m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {A_eqs[hz] || '-'}
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16}>
          <Col span={8} className="grid-first-col">
            <strong>Additional Absorption Areas</strong> &nbsp; (Aeq / m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {A_adds[hz] || '-'}
            </Col>
          ))}
        </Row>

        <div className="divider" />

        <Row type="flex" gutter={16} style={{ padding: '32px' }}>
          <Col span={6}>
            Total Surface Area: {surfaceAreas ? surfaceAreas.total : 0} m<sup>2</sup>
          </Col>
          <Col span={6}>
            Volume: {volume || 0} m<sup>3</sup>
          </Col>
        </Row>

        <div className="divider" />

        <Row type="flex" gutter={16}>
          <Col span={8} className="grid-first-col">
            <strong>Room Usage</strong>&nbsp;(DIN 18041)
          </Col>
          <Col span={16}>
            <Radio.Group size="large" defaultValue="a" buttonStyle="solid">
              <Radio.Button value="A1">Music</Radio.Button>
              <Radio.Button value="A2">Speech / Presentation</Radio.Button>
              <Radio.Button value="A3">Education / Communication</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>

        <Row type="flex" gutter={16}>
          <Col span={8} className="grid-first-col">
            <strong>Target Reverberation Time</strong>
            &nbsp;
            (RT60 / s)
            &nbsp;
            <Switch
              checkedChildren={<Icon type="edit" />}
              name="customRT60Target"
              checked={this.state.customRT60Target}
              onChange={this.handleCustomRT60Target}
            />
          </Col>
          <Col span={16}>
            <InputNumber
              name="RT60Target"
              size="large"
              step={.05}
              onChange={this.handleCustomRT60TargetInput}
              value={this.state['RT60Target']}
              disabled={!this.state.customRT60Target}
            />
          </Col>
        </Row>

        <div className="divider" />

        <Row type="flex" gutter={16} style={{ padding: '32px 32px 0 32px' }}>
          <span>Measured Reverberation Times - RT60 (s)</span>
        </Row>

        <Row type="flex" gutter={16} style={{ padding: '32px' }}>
          {FrequencyDomain.map(hz => (
            <Col span={3} key={hz}>
              {this.state[hz+'-A-eq']}
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16} style={{ padding: '32px' }}>
          <Col span={6}>
            Average
          </Col>
          <Col span={6}>
          </Col>
        </Row>
      </div>
    )
  }
}

export default App
