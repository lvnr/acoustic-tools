import React, { Component } from 'react'
import { Row, Col, InputNumber, Input, Button, Cascader } from 'antd'
import _ from 'lodash'
import absorbers from './absorbers'

// const { Option, OptGroup } = Select

const FrequencyDomain = [63, 125, 250, 500, 1000, 2000, 4000, 8000]

const absorberOptions = _.map(absorbers, (absorberGroup, label) => {
  return {
    label: label,
    value: label,
    children: _.map(absorberGroup, (absorber) => ({
      label: absorber.name,
      value: absorber.type,
    }))
  }
})

const Absorber = ({ index, name, width, height, type, selection, coefficients, onValueUpdate, onRemove, onCoefficientUpdate, onAbsorberSelect }) => {
  const onUpdate = (e) => {
    onValueUpdate(index, e.target.name, e.target.value)
  }

  const handleRemove = () => onRemove(index)

  const handleCoefficientUpdate = (e) => {
    const newCoefficients = {
      ...coefficients,
      [e.target.name]: e.target.value,
    }
    onCoefficientUpdate(index, newCoefficients)
  }

  const handleAbsorberSelect = (selection) => {
    if (selection[0] === 'custom')
      return onAbsorberSelect(index, { name: 'Custom', type: 'custom', coefficients: {}, selection })
    const absorberGroup = absorbers[selection[0]]
    const absorber = {
      ..._.find(absorberGroup, a => a.type === selection[1]),
      selection,
      width,
      height,
    }
    onAbsorberSelect(index, absorber)
  }

  const filter = (inputValue, path) => {
    return (path.some(option => (option.label).toLowerCase().indexOf(inputValue.toLowerCase()) > -1));
  }

  return (
    <Row type="flex" gutter={16} style={{ marginBottom: 20 }}>
      <Col span={8}>
        <Row gutter={16}>
          <Col span={12}>
            <Input
              type="number"
              name="width"
              size="large"
              placeholder="width (cm)"
              onChange={onUpdate}
              value={width}
            />
          </Col>
          <Col span={12}>
            <Input
              type="number"
              name="height"
              size="large"
              placeholder="height (cm)"
              onChange={onUpdate}
              value={height}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 10 }}>
          <Col span={20}>
            <Cascader
              size="large"
              style={{ width: '100%' }}
              placeholder="Absorber type"
              options={[ ...absorberOptions, { label: 'Custom', value: 'custom' } ]}
              onChange={handleAbsorberSelect}
              showSearch={{ filter }}
              value={selection}
            />
          </Col>
          <Col span={4}>
            <Button
              onClick={handleRemove}
              icon="delete"
              type="danger"
              size="large"
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Col>

      {type === 'custom'
        ? FrequencyDomain.map(hz => (
          <Col span={2} key={hz}>
            <Input
              name={hz}
              size="large"
              placeholder={hz}
              onChange={handleCoefficientUpdate}
              value={coefficients ? coefficients[hz] : 0}
              style={{ textAlign: 'center' }}
            />
          </Col>
        ))
        : FrequencyDomain.map(hz => (
          <Col span={2} key={hz} className="grid-col">
            {coefficients ? coefficients[hz] : '-'}
          </Col>
        ))
      }
    </Row>
  )
}

export default Absorber
