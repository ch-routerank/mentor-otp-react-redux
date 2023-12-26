import { connect } from 'react-redux'
import { Feature, lineString, LineString, Position } from '@turf/helpers'
import { Itinerary, Location } from '@opentripplanner/types'
import { Marker } from 'react-map-gl'
import centroid from '@turf/centroid'
import distance from '@turf/distance'
import polyline from '@mapbox/polyline'
import React, { useContext } from 'react'
import styled from 'styled-components'

import { AppReduxState } from '../../util/state-types'
import { boxShadowCss } from '../form/batch-styled'
import { ComponentContext } from '../../util/contexts'
import { doMergeItineraries } from '../narrative/narrative-itineraries'
import {
  getActiveItinerary,
  getActiveSearch,
  getVisibleItineraryIndex
} from '../../util/state'
import {
  setActiveItinerary,
  setVisibleItinerary
} from '../../actions/narrative'
import MetroItineraryRoutes from '../narrative/metro/metro-itinerary-routes'

type ItinWithGeometry = Itinerary & { allLegGeometry: Feature<LineString> }

type Props = {
  from: Location
  itins: Itinerary[]
  setActiveItinerary: ({ index }: { index: number | null }) => void
  setVisibleItinerary: ({ index }: { index: number | null }) => void
  to: Location
  visible?: boolean
  visibleItinerary?: number
}

const Card = styled.div`
  ${boxShadowCss}

  background: #fffffffa;
  border-radius: 5px;
  padding: 5px;
  align-items: center;
  display: flex;
  flex-wrap: wrap;

  
  span {
    span {
      span {
        max-height: 28px;
        min-height: 20px;
      }
    }
  }
  div {
    margin-top: -0px!important;
  }
  .route-block-wrapper span {
    padding: 0px;
  }
  * {
    height: 27px;
  }
}
`

function addItinLineString(itin: Itinerary): ItinWithGeometry {
  return {
    ...itin,
    allLegGeometry: lineString(
      itin.legs.flatMap((leg) => polyline.decode(leg.legGeometry.points))
    )
  }
}

type ItinUniquePoint = {
  itin: Itinerary
  uniquePoint: Position
}

function getUniquePoint(
  thisItin: ItinWithGeometry,
  otherPoints: ItinUniquePoint[]
): ItinUniquePoint {
  const otherMidpoints = otherPoints.map((mp) => mp.uniquePoint)
  let maxDistance = -Infinity
  const line = thisItin.allLegGeometry
  const centerOfLine = centroid(line).geometry.coordinates
  let uniquePoint = centerOfLine

  line.geometry.coordinates.forEach((point) => {
    const totalDistance = otherMidpoints.reduce(
      (prev, cur) => (prev += distance(point, cur)),
      0
    )

    const selfDistance = distance(point, centerOfLine)
    // maximize distance from all other points while minimizing distance to center of our own line
    const averageDistance = totalDistance / otherMidpoints.length - selfDistance

    if (averageDistance > maxDistance) {
      maxDistance = averageDistance
      uniquePoint = point
    }
  })
  return { itin: thisItin, uniquePoint }
}

const ItinerarySummaryOverlay = ({
  itins,
  setActiveItinerary: setActive,
  setVisibleItinerary: setVisible,
  visible,
  visibleItinerary
}: Props) => {
  // @ts-expect-error React context is populated dynamically
  const { LegIcon } = useContext(ComponentContext)

  let sharedTimeout: null | NodeJS.Timeout = null

  if (!itins || !visible) return <></>
  const mergedItins: ItinWithGeometry[] =
    doMergeItineraries(itins).mergedItineraries.map(addItinLineString)
  const midPoints = mergedItins.reduce<ItinUniquePoint[]>((prev, curItin) => {
    prev.push(getUniquePoint(curItin, prev))
    return prev
  }, [])
  // The first point is probably not well placed, so let's run the algorithm again
  if (midPoints.length > 1) {
    midPoints[0] = getUniquePoint(mergedItins[0], midPoints)
  }

  try {
    return (
      <>
        {midPoints.map(
          (mp, index) =>
            // If no itinerary is hovered, show all of them. If one is selected, show only that one
            // TODO: does this cause an issue with the merging? is the right itinerary selected?`
            (visibleItinerary !== null && visibleItinerary !== undefined
              ? visibleItinerary === index
              : true) &&
            mp.uniquePoint && (
              <Marker
                key={mp.itin.duration}
                latitude={mp.uniquePoint[0]}
                longitude={mp.uniquePoint[1]}
                style={{ cursor: 'pointer' }}
              >
                <Card
                  onClick={() => {
                    setActive({ index })
                  }}
                  onMouseEnter={() => {
                    sharedTimeout = setTimeout(() => {
                      setVisible({ index })
                    }, 150)
                  }}
                  onMouseLeave={() => {
                    sharedTimeout && clearTimeout(sharedTimeout)
                    setVisible({ index: null })
                  }}
                >
                  <MetroItineraryRoutes
                    expanded={false}
                    itinerary={mp.itin}
                    LegIcon={LegIcon}
                  />
                </Card>
              </Marker>
            )
        )}
      </>
    )
  } catch (error) {
    console.warn(`Can't create geojson from route: ${error}`)
    return <></>
  }
}

const mapStateToProps = (state: AppReduxState) => {
  const { activeSearchId, config } = state.otp
  if (config.itinerary?.previewOverlay !== true) {
    return {}
  }
  if (!activeSearchId) return {}

  const visibleItinerary = getVisibleItineraryIndex(state)
  const activeItinerary = getActiveItinerary(state)

  const activeSearch = getActiveSearch(state)
  // @ts-expect-error state is not typed
  const itins = activeSearch?.response.flatMap(
    (serverResponse: { plan?: { itineraries?: Itinerary[] } }) =>
      serverResponse?.plan?.itineraries
  )

  // @ts-expect-error state is not typed
  const query = activeSearch ? activeSearch?.query : state.otp.currentQuery
  const { from, to } = query

  return {
    from,
    itins,
    to,
    visible: activeItinerary === undefined || activeItinerary === null,
    visibleItinerary
  }
}

const mapDispatchToProps = { setActiveItinerary, setVisibleItinerary }

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ItinerarySummaryOverlay)
