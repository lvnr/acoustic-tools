import React from 'react'
import { VictoryArea, VictoryChart, VictoryAxis, VictoryGroup, VictoryLine } from 'victory'
import { getFrequencyDomain } from './helpers'

const FrequencyDomain = getFrequencyDomain()

const Chart = ({ state, data }) => {
  const RT60TolerancesFormatted = FrequencyDomain.map(hz => {
    const range = data.RT60Tolerances[hz]
    return { x: hz, y: range[0], y0: range[1] }
  })

  return (
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
          border: '1px solid #e8e8e8',
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
        {state.showMeasuredRT60 && (
          <VictoryArea
            style={{
              data: {
                fill: 'rgb(0, 82, 255)',
                fillOpacity: .6,
                strokeWidth: 0,
              },
              labels: {
                fontSize: 6,
                fill: "#ccc"
              }
            }}
            // labels={(d) => d.RT60}
            interpolation="natural"
            x="frequency"
            y="RT60"
            domain={{ x: [63, 8000] }}
            data={data.measuredRT60Formatted}
          />
        )}

        {state.showEffectiveRT60 && (
          <VictoryArea
            style={{
              data: {
                fill: 'rgb(0, 0, 0)',
                fillOpacity: .9,
                strokeWidth: 0,
              },
            }}
            interpolation="natural"
            x="frequency"
            y="RT60"
            domain={{ x: [63, 8000] }}
            data={data.effectiveRT60Formatted}
          />
        )}

        {state.showRT60Tolerances && (
          <VictoryArea
            style={{
              data: {
                fill: 'rgb(51, 255, 204)',
                fillOpacity: .5,
                strokeWidth: 0,
              },
            }}
            domain={{ x: [63, 8000] }}
            data={RT60TolerancesFormatted}
          />
        )}

        {state.showTargetRT60 && (
          <VictoryLine
            style={{ data: { stroke: 'red' } }}
            data={[
              { x: 63, y: data.TargetRT60 },
              { x: 8000, y: data.TargetRT60 },
            ]}
          />
        )}
      </VictoryGroup>
    </VictoryChart>
  )
}

export default Chart
