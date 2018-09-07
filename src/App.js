import React, { Component } from 'react'
import { Layout, Row, Col, Input, InputNumber, Radio, Switch, Icon, Button, Select, Divider, Card } from 'antd'
import { Persist } from './react-persist'
import { VictoryArea, VictoryChart, VictoryAxis, VictoryGroup, VictoryLine } from 'victory'
import _ from 'lodash'
import Acoustics from './Acoustics'
import Absorber from './Absorber'
import './App.css'
import db from './db'
import { getFrequencyDomain } from './helpers'

const { Content } = Layout
const { Option } = Select

const FrequencyDomain = getFrequencyDomain()

class App extends Component {
  constructor(props) {
    super(props)

    const project = window.localStorage.getItem('project')
    const room = window.localStorage.getItem('room')

    this.state = {
      project,
      room,
      newProject: '',
      newRoom: '',
      length: null,
      width: null,
      height: null,
      RT60Target: null,
      customRT60Target: true,
      measuredRT60: { 63: null, 125: null, 250: null, 500: null, 1000: null, 2000: null, 4000: null, 8000: null },
      absorbers: [],
      showMeasuredRT60: true,
      showEffectiveRT60: true,
      showTargetRT60: true,
      showAllowedDeviation: true,
    }
  }

  getProjects = () => db.get('projects').value()

  kebab = (string) => {
    return string
      .replace(/([a-z])([A-Z])/g, '$1-$2')    // get all lowercase letters that are near to uppercase ones
      .replace(/[\s_]+/g, '-')                // replace all spaces and low dash
      .toLowerCase()                          // convert to lower case
  }

  handleChartOption = (option, checked) => {
    this.setState({ [option]: checked })
  }

  handleAddAbsorber = () => {
    const newAbsorber = {
      name: 'Custom',
      type: 'custom',
      coefficients: {},
    }
    this.setState({ absorbers: [ ...this.state.absorbers, newAbsorber ]})
  }

  handleAbsorberUpdate = (index, field, value) => {
    let absorbers = [ ...this.state.absorbers ]
    absorbers[index] = { ...absorbers[index], [field]: value }
    this.setState({ absorbers })
  }

  handleAbsorberRemoval = (index) => {
    let absorbers = [ ...this.state.absorbers ]
    _.pullAt(absorbers, index)
    this.setState({ absorbers })
  }

  handleCoefficientUpdate = (index, coefficients) => {
    let absorbers = [ ...this.state.absorbers ]
    absorbers[index] = { ...absorbers[index], coefficients }
    this.setState({ absorbers })
  }

  handleAbsorberSelect = (index, absorber) => {
    let absorbers = [ ...this.state.absorbers ]
    absorbers[index] = { ...absorber }
    this.setState({ absorbers })
  }

  handleAddRoom = (room) => {
    const { project } = this.state
    db.set(`projects.${project}.rooms.${this.kebab(room)}`, { name: room })
      .write()
    this.setState({ newRoom: null })
  }

  handleAddProject = (project) => {
    const projects = db
      .set(`projects.${this.kebab(project)}`, {
        name: project,
        rooms: {},
      })
      .write()
    this.setState({ newProject: null })
  }

  handleProjectChange = (project) => {
    this.setState({ project, room: null })
    window.localStorage.setItem('project', project)
  }

  handleRoomChange = (room) => {
    this.setState({ room })
    window.localStorage.setItem('room', room)
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

  handleRoomType = (e) => {
    this.setState({ [e.target.name]: e.target.value, customRT60Target: false })
  }

  handleMeasuredRT60Input = (e) => {
    this.setState({ measuredRT60: { ...this.state.measuredRT60, [e.target.name]: e.target.value } })
  }

  handlePersistence = () => {
    const { project, room } = this.state
    let persistenceKey
    if (project && room) persistenceKey = project + '__' + room
    return (
      <Persist
        name={persistenceKey}
        data={this.state}
        debounce={500}
        onData={data => { this.setState(data) }}
      />
    )
  }

  render() {
    const { project, room, width, length, height, absorbers, customRT60Target } = this.state
    const dimensions = { width, length, height }

    const surfaceAreas = Acoustics.surfaceAreas(dimensions)
    const volume = Acoustics.volume(dimensions)
    const measuredRT60Formatted = FrequencyDomain.map(hz => ({ frequency: hz, RT60: Number(this.state.measuredRT60[hz]) || 0 }))
    const A_eqs = Acoustics.A_eqs(measuredRT60Formatted, volume)
    const alphas = Acoustics.alphas(A_eqs, surfaceAreas.total)
    const DIN_RT60 = Acoustics.getTargetRT60(this.state.roomType || 'A1', volume)
    const TargetRT60 = customRT60Target ? this.state.RT60Target : DIN_RT60
    const A_adds = Acoustics.A_adds(A_eqs, measuredRT60Formatted, alphas, TargetRT60, volume)
    const A_eq_absorbers = Acoustics.A_eq_absorbers(absorbers)
    const effectiveRT60 = Acoustics.effectiveRT60(A_eqs, A_eq_absorbers, volume)
    const effectiveRT60Formatted = FrequencyDomain.map(hz => ({ frequency: hz, RT60: Number(effectiveRT60[hz]) || 0 }))

    const projects = this.getProjects()
    let rooms
    if (project && projects[project]) {
      rooms = projects[project]['rooms']
    }

    return (
      <div className="App">

        {this.handlePersistence()}

        <Divider orientation="left">Project & Room</Divider>

        <Row type="flex" gutter={16} style={{ padding: '32px' }}>
          <Card style={{ width: '100%', marginBottom: 20 }}>
            <span>PROJECT</span>
            <Divider type="vertical" />
            <Select
              showSearch
              style={{ width: 250 }}
              size="large"
              placeholder="Select a project"
              optionFilterProp="children"
              onChange={this.handleProjectChange}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              value={this.state.project}
            >
              {_.map(projects, (project, id) => <Option key={id} value={id}>{project.name}</Option>)}
            </Select>
            <Divider type="vertical" />
            <Input.Search
              name="newProject"
              style={{ width: 250 }}
              enterButton={<Button type="primary" icon="plus" />}
              onSearch={this.handleAddProject}
              onChange={this.handleInput}
              value={this.state.newProject}
            />
          </Card>
          <Card style={{ width: '100%' }}>
            <span>ROOM</span>
            <Divider type="vertical" />
            <Select
              showSearch
              style={{ width: 250 }}
              size="large"
              placeholder="Select a room"
              optionFilterProp="children"
              onChange={this.handleRoomChange}
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              value={this.state.room}
            >
              {_.map(rooms, (room, id) => <Option key={id} value={id}>{room.name}</Option>)}
            </Select>
            <Divider type="vertical" />
            <Input.Search
              name="newRoom"
              style={{ width: 250 }}
              enterButton={<Button type="primary" icon="plus" />}
              onSearch={this.handleAddRoom}
              onChange={this.handleInput}
              value={this.state.newRoom}
            />
          </Card>
        </Row>

        <Divider orientation="left">Room Dimensions</Divider>

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

        <Row type="flex" gutter={16} style={{ padding: '32px' }}>
          <Col span={6}>
            Total Surface Area: {surfaceAreas ? surfaceAreas.total : 0} m<sup>2</sup>
          </Col>
          <Col span={6}>
            Volume: {volume || 0} m<sup>3</sup>
          </Col>
        </Row>

        <Divider orientation="left">Acoustic Properties</Divider>

        <Row type="flex" gutter={16} style={{ textAlign: 'center' }}>
          <Col span={8}> </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz}>
              <strong>{hz}</strong>Hz
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16} style={{ paddingTop: '32px' }} className="grid">
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

        <Row type="flex" gutter={16} className="grid">
          <Col span={8} className="grid-first-col">
            <strong>Equivalent Absorption Areas</strong> &nbsp; (Aeq / m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {A_eqs[hz] || '-'}
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16} className="grid">
          <Col span={8} className="grid-first-col">
            <strong>Additional Absorption Areas</strong> &nbsp; (Aadd / m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {A_adds[hz] || '-'}
            </Col>
          ))}
        </Row>

        <Divider>Additional Absorption</Divider>

        {absorbers.map((absorber, i) => (
          <Absorber
            key={i}
            index={i}
            {...absorber}
            onValueUpdate={this.handleAbsorberUpdate}
            onRemove={this.handleAbsorberRemoval}
            onCoefficientUpdate={this.handleCoefficientUpdate}
            onAbsorberSelect={this.handleAbsorberSelect}
          />
        ))}

        <Row type="flex" gutter={16} className="grid" style={{ justifyContent: 'center', margin: '10px 0' }}>
          <Button type="dashed" size="large" icon="plus" onClick={this.handleAddAbsorber} style={{ padding: '5px 20px' }}>
            Add new absorber
          </Button>
        </Row>

        <Row type="flex" gutter={16} className="grid">
          <Col span={8} className="grid-first-col">
            <strong>Total A<sub>eq</sub></strong> &nbsp; (m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {A_eq_absorbers[hz] || '-'}
            </Col>
          ))}
        </Row>

        <Divider />

        <Row type="flex" gutter={16} className="grid">
          <Col span={8} className="grid-first-col">
            <strong>Remaining Add. Absorption Required</strong> &nbsp; (A / m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {_.round(A_adds[hz] - A_eq_absorbers[hz], 2) || 0}
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16} className="grid">
          <Col span={8} className="grid-first-col">
            <strong>Resulting RT60</strong> &nbsp; (T / s)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {effectiveRT60[hz] || '-'}
            </Col>
          ))}
        </Row>

        <Row type="flex" gutter={16} style={{ padding: '32px 32px 0 32px' }}>
          <VictoryChart
            height={200}
            width={400}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 }
            }}
            style={{
              labels: {
                fontSize: 8,
              },
              parent: {
                border: "1px solid #e8e8e8",
                borderRadius: "6px",
              }
            }}
          >
            <VictoryAxis
              tickValues={FrequencyDomain}
              label="Frequency (Hz)"
              scale={{ x: 'log', y: 'linear' }}
              style={{
                axis: { stroke: '#000' },
                axisLabel: { fontSize: 8 },
                grid: { stroke: '#eee' },
                ticks: { stroke: '#000', size: 3 },
                tickLabels: { fontSize: 7, padding: 5 }
              }}
              tickFormat={(t) => t < 1000 ? t : `${t/1000}k`}
            />
            <VictoryAxis
              dependentAxis
              label="Reverberation Time (s)"
              style={{
                axis: { stroke: '#000' },
                axisLabel: { fontSize: 8 },
                grid: { stroke: '#eee' },
                ticks: { stroke: '#000', size: 3 },
                tickLabels: { fontSize: 7, padding: 5 }
              }}
            />
            <VictoryGroup>
              {this.state.showMeasuredRT60 && <VictoryArea
                style={{
                  data: {
                    fill: "#ccc", fillOpacity: 0.8,
                  },
                  labels: {
                    fontSize: 8,
                    fill: "#ccc"
                  }
                }}
                labels={(d) => d.RT60}
                interpolation="natural"
                x="frequency"
                y="RT60"
                domain={{ x: [63, 8000] }}
                data={measuredRT60Formatted}
              />}
              {this.state.showEffectiveRT60 && <VictoryArea
                interpolation="natural"
                x="frequency"
                y="RT60"
                style={{ data: { background: 'blue' } }}
                domain={{ x: [63, 8000] }}
                data={effectiveRT60Formatted}
              />}
              {this.state.showTargetRT60 && <VictoryLine
                style={{ data: { stroke: 'red' } }}
                data={[
                  { x: 63, y: TargetRT60 },
                  { x: 8000, y: TargetRT60 },
                ]}
              />}
            </VictoryGroup>
          </VictoryChart>
        </Row>


        <Row type="flex" gutter={16} style={{ textAlign: 'center', marginTop: '20px' }}>
          <Col span={6}>
            <strong>Measured RT60</strong> &nbsp;
            <Switch checked={this.state.showMeasuredRT60} onChange={c => this.handleChartOption('showMeasuredRT60', c)} />
          </Col>
          <Col span={6}>
            <strong>Effective RT60</strong> &nbsp;
            <Switch checked={this.state.showEffectiveRT60} onChange={c => this.handleChartOption('showEffectiveRT60', c)} />
          </Col>
          <Col span={6}>
            <strong>Target RT60</strong> &nbsp;
            <Switch checked={this.state.showTargetRT60} onChange={c => this.handleChartOption('showTargetRT60', c)} />
          </Col>
          <Col span={6}>
            <strong>Allowed Deviation</strong> &nbsp;
            <Switch checked={this.state.showAllowedDeviation} onChange={c => this.handleChartOption('showAllowedDeviation', c)} />
          </Col>
        </Row>

        <Divider />

        <Row type="flex" gutter={16} className="grid">
          <Col span={8} className="grid-first-col">
            <strong>Room Usage</strong>&nbsp;(DIN 18041)
          </Col>
          <Col span={16}>
            <Radio.Group
              name="roomType"
              size="large"
              buttonStyle="solid"
              onChange={this.handleRoomType}
              value={customRT60Target ? null : this.state.roomType}
            >
              <Radio.Button value="A1">Music</Radio.Button>
              <Radio.Button value="A2">Speech/Presentation</Radio.Button>
              <Radio.Button value="A3">Education/Communication</Radio.Button>
              <Radio.Button value="A4">Education/Communication Inclusive</Radio.Button>
              <Radio.Button value="A5">Sport</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>

        <Row type="flex" gutter={16} className="grid">
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
            {customRT60Target ? (
              <InputNumber
                name="RT60Target"
                size="large"
                step={.05}
                onChange={this.handleCustomRT60TargetInput}
                value={this.state['RT60Target']}
              />
            ) : (
              DIN_RT60 + 's'
            )}
          </Col>
        </Row>

        <Divider />
      </div>
    )
  }
}

export default App
