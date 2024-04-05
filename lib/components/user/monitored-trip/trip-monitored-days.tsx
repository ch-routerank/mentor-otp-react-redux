import { FormattedList, FormattedMessage, useIntl } from 'react-intl'

import InvisibleA11yLabel from '../../util/invisible-a11y-label'
import React from 'react'

import FormattedDayOfWeek from '../../util/formatted-day-of-week'
import FormattedDayOfWeekCompact from '../../util/formatted-day-of-week-compact'
import getBaseColor from '../../util/base-color'

import styled from 'styled-components'

interface Props {
  days: string[]
}

const DayCircleContainer = styled.div`
  display: flex;
  gap: 4px;
`

const MonitoredDay = styled.span<{ baseColor: string; monitored: boolean }>`
  align-items: center;
  background-color: ${(props) =>
    props.monitored ? props.baseColor : 'transparent'};
  border: 1px solid ${(props) => (props.monitored ? props.baseColor : '#333')};
  border-radius: 50%;
  color: ${(props) => (props.monitored ? 'white' : 'inherit')};
  display: flex;
  height: 27px;
  justify-content: center;
  opacity: ${(props) => (props.monitored ? 1 : 0.7)};
  text-transform: capitalize;
  width: 27px;
`

const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

const MonitoredDays = ({ days }: Props) => {
  const monitoredDaysList = (
    <FormattedList
      type="conjunction"
      value={days.map((d) => (
        <FormattedDayOfWeek day={d} key={d} />
      ))}
    />
  )

  const baseColor = getBaseColor()
  const DayCircles = daysOfWeek.map((d) => {
    const dayAbbrev = <FormattedDayOfWeekCompact day={d} />
    const monitored = days?.includes(d)
    return (
      <MonitoredDay baseColor={baseColor} key={d} monitored={monitored}>
        <span>{dayAbbrev}</span>
      </MonitoredDay>
    )
  })
  return (
    <>
      <InvisibleA11yLabel>
        <FormattedMessage
          id="components.TripSummaryPane.happensOnDays"
          values={{ days: monitoredDaysList }}
        />
      </InvisibleA11yLabel>
      <DayCircleContainer aria-hidden>{DayCircles}</DayCircleContainer>
    </>
  )
}

export default MonitoredDays
