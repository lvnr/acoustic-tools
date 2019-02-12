import React from 'react'
import { Row, Col, Input, Button, Cascader } from 'antd'
import _ from 'lodash'
import absorbers from './absorbers'
import { getFrequencyDomain } from './helpers'

const FrequencyDomain = getFrequencyDomain()

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

const Absorber = ({ index, name, width, height, quantity, type, selection, coefficients, sabins, onValueUpdate, onRemove, onCoefficientUpdate, onAbsorberSelect }) => {
  const onUpdate = (e) => {
    onValueUpdate(index, e.target.name, e.target.value)
  }

  const handleRemove = () => onRemove(index)

  const handleCoefficientUpdate = (e) => {
    const newCoefficients = {
      ...coefficients,
      ...sabins,
      [e.target.name]: e.target.value,
    }
    onCoefficientUpdate(index, newCoefficients)
  }

  const handleAbsorberSelect = (selection) => {
    if (selection[0] === 'custom-coefficients')
      return onAbsorberSelect(index, { name: 'Custom (coefficients)', type: 'custom-coefficients', coefficients: {}, selection })
    if (selection[0] === 'custom-sabins')
      return onAbsorberSelect(index, { name: 'Custom (sabins)', type: 'custom-sabins', sabins: {}, selection })
    const absorberGroup = absorbers[selection[0]]
    const absorber = {
      ..._.find(absorberGroup, a => a.type === selection[1]),
      selection,
      width,
      height,
      quantity,
    }
    onAbsorberSelect(index, absorber)
  }

  const filter = (inputValue, path) => {
    return (path.some(option => (option.label).toLowerCase().indexOf(inputValue.toLowerCase()) > -1));
  }

  return (
    <Row type="flex" gutter={16} style={{ marginBottom: 20 }}>
      <Col span={8}>
        {sabins && (
          <Row gutter={16}>
            <Col span={24}>
              <Input
                type="number"
                name="quantity"
                size="large"
                placeholder="quantity"
                onChange={onUpdate}
                value={quantity}
              />
            </Col>
          </Row>
        )}
        {coefficients && (
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
        )}
        <Row gutter={16} style={{ marginTop: 10 }}>
          <Col span={20}>
            <Cascader
              size="large"
              style={{ width: '100%' }}
              placeholder="Absorber type"
              options={[ ...absorberOptions, { label: 'Custom (coefficients)', value: 'custom-coefficients' }, { label: 'Custom (sabins)', value: 'custom-sabins' } ]}
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

      {type === 'custom-coefficients' || type === 'custom-sabins'
        ? FrequencyDomain.map(hz => (
          <Col span={2} key={hz}>
            <Input
              name={hz}
              size="large"
              placeholder={hz}
              onChange={handleCoefficientUpdate}
              value={coefficients ? coefficients[hz] : sabins ? sabins[hz] : 0}
              style={{ textAlign: 'center' }}
            />
          </Col>
        ))
        : FrequencyDomain.map(hz => (
          <Col span={2} key={hz} className="grid-col">
            {coefficients ? coefficients[hz] : sabins ? sabins[hz] : '-'}
          </Col>
        ))
      }
    </Row>
  )
}

export default Absorber
