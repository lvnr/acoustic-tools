import React, { Component } from 'react'
import { Layout, Row, Col, Input, InputNumber, Radio, Switch, Icon, Button, Select, Divider, Card } from 'antd'
import { Persist } from 'react-persist'
import { VictoryArea, VictoryChart, VictoryAxis } from 'victory'
import Acoustics from './Acoustics'
import './App.css'
import db from './db'

const { Content } = Layout
const { Option } = Select

const FrequencyDomain = [63, 125, 250, 500, 1000, 2000, 4000, 8000]

class App extends Component {
  state = {
    project: undefined,
    room: undefined,
    newProject: '',
    newRoom: '',
    length: 600,
    width: 400,
    height: 310,
    RT60Target: null,
    customRT60Target: true,
    measuredRT60: { 63: null, 125: null, 250: null, 500: null, 1000: null, 2000: null, 4000: null, 8000: null },
  }

  kebab = (string) => {
    return string
      .replace(/([a-z])([A-Z])/g, '$1-$2')    // get all lowercase letters that are near to uppercase ones
      .replace(/[\s_]+/g, '-')                // replace all spaces and low dash
      .toLowerCase()                          // convert to lower case
  }

  handleAddRoom = (room) => {
    const rooms = db
      .get('rooms')
      .push({
        name: room,
        id: this.kebab(room)
      })
      .write()
    this.setState({ newRoom: null })
  }

  handleAddProject = (project) => {
    const projects = db
      .get('projects')
      .push({
        name: project,
        id: this.kebab(project)
      })
      .write()
    this.setState({ newProject: null })
  }

  handleRoomChange = (room) => {
    this.setState({ room })
  }

  handleProjectChange = (project) => {
    this.setState({ project })
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

  render() {
    const { project, room, width, length, height, customRT60Target } = this.state
    const dimensions = { width, length, height }

    const surfaceAreas = Acoustics.surfaceAreas(dimensions)
    const volume = Acoustics.volume(dimensions)
    const measuredRT60Data = FrequencyDomain.map(hz => ({ frequency: hz, RT60: Number(this.state.measuredRT60[hz]) }))
    const A_eqs = Acoustics.A_eqs(measuredRT60Data, volume)
    const alphas = Acoustics.alphas(A_eqs, surfaceAreas.total)
    const DIN_RT60 = Acoustics.getTargetRT60(this.state.roomType || 'A1', volume)
    const TargetRT60 = customRT60Target ? this.state.RT60Target : DIN_RT60
    const A_adds = Acoustics.A_adds(A_eqs, measuredRT60Data, alphas, TargetRT60, volume)

    const projects = db.get('projects').value()
    const rooms = db.get('rooms').value()

    let persistenceKey = 'room-data'
    if (project && room) persistenceKey = project + '__' + room

    return (
      <div className="App">
        <Persist
          name={persistenceKey}
          data={this.state}
          debounce={500}
          onMount={data => this.setState(data)}
        />

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
              {projects.map((project, i) => <Option key={i} value={project.id}>{project.name}</Option>)}
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
              {rooms.map((room, i) => <Option key={i} value={room.id}>{room.name}</Option>)}
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
            <strong>Additional Absorption Areas</strong> &nbsp; (Aeq / m<sup>2</sup>)
          </Col>
          {FrequencyDomain.map(hz => (
            <Col span={2} key={hz} className="grid-col">
              {A_adds[hz] || '-'}
            </Col>
          ))}
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
