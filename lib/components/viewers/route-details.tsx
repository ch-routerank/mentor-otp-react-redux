import { connect } from 'react-redux'
import { Dropdown } from '@opentripplanner/building-blocks'
import { FormattedMessage, injectIntl, IntlShape } from 'react-intl'
import { getMostReadableTextColor } from '@opentripplanner/core-utils/lib/route'
import { Stop, TransitOperator } from '@opentripplanner/types'
import React, { Component } from 'react'
import styled from 'styled-components'

import * as uiActions from '../../actions/ui'
import { DEFAULT_ROUTE_COLOR } from '../util/colors'
import { extractMainHeadsigns, PatternSummary } from '../../util/pattern-viewer'
import { getOperatorName } from '../../util/state'
import { getRouteColorBasedOnSettings } from '../../util/viewer'
import { LinkOpensNewWindow } from '../util/externalLink'
import {
  SetViewedRouteHandler,
  SetViewedStopHandler,
  ViewedRouteObject
} from '../util/types'
import { UnstyledButton } from '../util/unstyled-button'

import {
  Container,
  HeadsignSelectLabel,
  LogoLinkContainer,
  PatternContainer,
  RouteNameContainer,
  StopContainer,
  StopLink,
  Stop as StyledStop
} from './styled'

const PatternSelectButton = styled(UnstyledButton)`
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const PatternSelectDropdown = styled(Dropdown)`
  button {
    float: right;
    line-height: 20px;
    padding: 3px 7px;
  }

  span,
  span.caret {
    color: #333;
  }

  span.caret {
    margin-left: 2px;
  }
`

interface Props {
  intl: IntlShape
  operator: TransitOperator
  patternId: string
  route: ViewedRouteObject
  setHoveredStop: (id: string | null) => void
  setViewedRoute: SetViewedRouteHandler
  setViewedStop: SetViewedStopHandler
}

class RouteDetails extends Component<Props> {
  /**
   * If a headsign link is clicked, set that pattern in redux state so that the
   * view can adjust
   */
  _headSignButtonClicked = (id: string) => {
    const { route, setViewedRoute } = this.props
    setViewedRoute({ patternId: id, routeId: route.id })
  }

  // FIXME: this should be the Stop type but
  // we can't do that because Stop is a duplicate identifier (imported from styled)
  /**
   * If a stop link is clicked, redirect to stop viewer
   */
  _stopLinkClicked = (stop: Stop) => {
    const { setViewedStop } = this.props
    setViewedStop(stop)
  }

  _editHeadsign = (pattern: PatternSummary) => {
    pattern.headsign = this.props.intl.formatMessage(
      { id: 'components.RouteDetails.headsignTo' },
      { ...pattern }
    ) as string
  }

  render() {
    const { intl, operator, patternId, route, setHoveredStop } = this.props
    const { agency, patterns = {}, shortName, url } = route
    const pattern = patterns[patternId]

    const moreDetailsURL = url || route?.agency?.url

    const routeColor = getRouteColorBasedOnSettings(operator, route)

    const headsigns = extractMainHeadsigns(
      patterns,
      shortName,
      this._editHeadsign
    ).sort((a, b) => {
      // sort by number of vehicles on that pattern
      const aVehicleCount =
        route.vehicles?.filter((vehicle) => vehicle.patternId === a.id)
          .length || 0
      const bVehicleCount =
        route.vehicles?.filter((vehicle) => vehicle.patternId === b.id)
          .length || 0

      // if both have the same count, sort by pattern geometry length
      if (aVehicleCount === bVehicleCount) {
        return b.geometryLength - a.geometryLength
      }
      return bVehicleCount - aVehicleCount
    })

    const patternSelectLabel = intl.formatMessage({
      id: 'components.RouteDetails.selectADirection'
    })

    const patternSelectName =
      headsigns.find((h) => h.id === pattern?.id)?.headsign ||
      patternSelectLabel

    return (
      <Container
        backgroundColor={routeColor}
        full={pattern != null}
        textColor={getMostReadableTextColor(routeColor, route?.textColor)}
      >
        <RouteNameContainer>
          <LogoLinkContainer>
            {agency && (
              <>
                {/** TODO: use <OperatorLogo /> here? */}
                <FormattedMessage
                  id="components.RouteDetails.operatedBy"
                  values={{
                    agencyName: getOperatorName(operator, route)
                  }}
                />
              </>
            )}
            {moreDetailsURL && (
              <LinkOpensNewWindow
                contents={
                  <FormattedMessage id="components.RouteDetails.moreDetails" />
                }
                style={{
                  color: getMostReadableTextColor(routeColor, route?.textColor)
                }}
                url={moreDetailsURL}
              />
            )}
          </LogoLinkContainer>
        </RouteNameContainer>
        {headsigns && headsigns.length > 0 && (
          <PatternContainer>
            <HeadsignSelectLabel htmlFor="headsign-selector-label">
              <FormattedMessage id="components.RouteDetails.stopsTo" />
            </HeadsignSelectLabel>
            <PatternSelectDropdown
              id="headsign-selector"
              label={patternSelectLabel}
              style={{ color: 'black' }}
              text={patternSelectName}
            >
              {headsigns.map((h: PatternSummary) => (
                <li key={h.id}>
                  <PatternSelectButton
                    onClick={() => this._headSignButtonClicked(h.id)}
                    value={h.id}
                  >
                    <span>{h.headsign}</span>
                  </PatternSelectButton>
                </li>
              ))}
            </PatternSelectDropdown>
          </PatternContainer>
        )}
        {pattern && (
          <>
            <h2
              style={{
                fontSize: 'inherit',
                fontWeight: 400,
                margin: '0 0 10px 8px'
              }}
            >
              <FormattedMessage id="components.RouteViewer.stopsInDirectionOfTravel" />
            </h2>
            <StopContainer
              backgroundColor={routeColor}
              onMouseLeave={() => setHoveredStop(null)}
              textColor={getMostReadableTextColor(routeColor, route?.textColor)}
            >
              {pattern?.stops?.map((stop, index) => (
                <StyledStop
                  // Use array index instead of stop id because a stop can be visited several times.
                  key={index}
                  onClick={() => this._stopLinkClicked(stop)}
                  onMouseOver={() => setHoveredStop(stop.id)}
                  routeColor={
                    routeColor.includes('ffffff')
                      ? DEFAULT_ROUTE_COLOR
                      : routeColor
                  }
                  textColor={getMostReadableTextColor(
                    routeColor,
                    route?.textColor
                  )}
                >
                  <StopLink
                    name={stop.name}
                    onFocus={() => setHoveredStop(stop.id)}
                    textColor={getMostReadableTextColor(
                      routeColor,
                      route?.textColor
                    )}
                  >
                    {stop.name}
                  </StopLink>
                </StyledStop>
              ))}
            </StopContainer>
          </>
        )}
      </Container>
    )
  }
}

// connect to redux store
const mapDispatchToProps = {
  setHoveredStop: uiActions.setHoveredStop,
  setViewedRoute: uiActions.setViewedRoute,
  setViewedStop: uiActions.setViewedStop
}

export default connect(null, mapDispatchToProps)(injectIntl(RouteDetails))
