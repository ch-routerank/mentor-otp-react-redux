import { DelimitedArrayParam, encodeQueryParams } from 'serialize-query-params'
import { IntlShape } from 'react-intl'
import { ModeButtonDefinition, ModeSetting } from '@opentripplanner/types'
import React from 'react'

import { getFormattedMode } from '../../util/i18n'
import { hasValidLocation } from '../../util/state'
import { RoutingQueryCallResult } from '../../actions/api-constants'
import { updateQueryTimeIfLeavingNow } from '../../actions/form'

// This method is used to daisy-chain a series of functions together on a given value
export function pipe<T>(...fns: Array<(arg: T) => T>) {
  return (value: T) => fns.reduce((acc, fn) => fn(acc), value)
}

export const modesQueryParamConfig = { modeButtons: DelimitedArrayParam }

export const populateSettingWithIcon =
  (ModeIcon: React.ComponentType<{ mode?: string; width?: number }>) =>
  // eslint-disable-next-line react/display-name
  (msd: ModeSetting): ModeSetting => ({
    ...msd,
    icon: <ModeIcon mode={msd.iconName} width={16} />
  })

export const addModeButtonIcon =
  (ModeIcon: React.ComponentType<{ mode?: string; width?: number }>) =>
  (def: ModeButtonDefinition): ModeButtonDefinition => ({
    ...def,
    Icon: function ModeButtonIcon() {
      return <ModeIcon mode={def.iconName} />
    }
  })

export const addCustomSettingLabels =
  (intl: IntlShape) =>
  (msd: ModeSetting): ModeSetting => {
    let modeLabel
    // If we're using route mode overrides, make sure we're using the custom mode name
    if (msd.type === 'SUBMODE') {
      modeLabel = msd.overrideMode || msd.addTransportMode.mode
      return {
        ...msd,
        label: getFormattedMode(modeLabel, intl)
      }
    }
    return msd
  }

/**
 * Stores parameters in both the Redux `currentQuery` and URL
 * @param params Params to store
 */
export const onSettingsUpdate =
  (setQueryParam: (evt: any) => void) => (params: any) => {
    setQueryParam({ queryParamData: params, ...params })
  }

const getModeButtonFromSubmode = (
  key: string,
  modeButtons: ModeButtonDefinition[]
): ModeButtonDefinition | undefined => {
  return modeButtons.find((button: ModeButtonDefinition) => {
    if (button.modeSettings) {
      return button.modeSettings.some((setting: ModeSetting) => {
        // check if transport mode
        if (
          (setting.type === 'CHECKBOX' || setting.type === 'SUBMODE') &&
          setting.addTransportMode
        ) {
          return setting.key === key
        }
        return false
      })
    }
    return false
  })
}

export const onAdvancedModeSubsettingsUpdate =
  (
    setQueryParam: (evt: any) => void,
    processedModeButtons: ModeButtonDefinition[],
    handleModeButtonToggle: (buttonId: string, newState: boolean) => void
  ) =>
  (params: any) => {
    // check if setting is a transport mode and get the mode button that contains it
    const modeButton = getModeButtonFromSubmode(
      Object.keys(params)[0],
      processedModeButtons
    )
    if (modeButton && modeButton.modeSettings && !Object.values(params)[0]) {
      const transportModeSettings = modeButton.modeSettings.filter(
        (setting: ModeSetting) =>
          (setting.type === 'CHECKBOX' || setting.type === 'SUBMODE') &&
          setting.addTransportMode
      )
      // if we're disabling a transport mode, we need to check if the mode button needs to be disabled (all of its subsettings are false)
      const allFalse = transportModeSettings.every((setting: ModeSetting) => {
        if (setting.key === Object.keys(params)[0]) {
          return !Object.values(params)[0]
        }
        return !setting.value
      })
      if (allFalse) {
        transportModeSettings.forEach((setting) => (params[setting.key] = true))
        handleModeButtonToggle(modeButton.key, false)
      }
    }
    setQueryParam({ queryParamData: params, ...params })
  }

export const setModeButton =
  (enabledModeButtons: string[], updateHandler: (params: any) => void) =>
  (buttonId: string, newState: boolean) => {
    console.log('SET MODE BUTTON IS BEING CALLED. NEW STATE:::: ', newState)
    let newButtons

    if (newState) {
      // enable modeButton
      // we need to add it to the list of enabled buttons
      newButtons = [...enabledModeButtons, buttonId]
    } else {
      // disable modeButton
      // we need to remove it from the list of enabled buttons
      newButtons = enabledModeButtons.filter((c) => c !== buttonId)
    }
    // encodeQueryParams serializes the mode buttons for the URL
    // to get nice looking URL params and consistency
    updateHandler(
      encodeQueryParams(modesQueryParamConfig, { modeButtons: newButtons })
    )
  }

export const alertUserTripPlan = (
  intl: IntlShape,
  currentQuery: any,
  onPlanTripClick: () => void,
  routingQuery: () => any
): void => {
  // Check for any validation issues in query.
  const issues: string[] = []
  if (!hasValidLocation(currentQuery, 'from')) {
    issues.push(intl.formatMessage({ id: 'components.BatchSettings.origin' }))
  }
  if (!hasValidLocation(currentQuery, 'to')) {
    issues.push(
      intl.formatMessage({ id: 'components.BatchSettings.destination' })
    )
  }
  onPlanTripClick()
  if (issues.length > 0) {
    // TODO: replace with less obtrusive validation.
    window.alert(
      intl.formatMessage(
        { id: 'components.BatchSettings.validationMessage' },
        { issues: intl.formatList(issues, { type: 'conjunction' }) }
      )
    )
    return
  }

  // Plan trip.
  updateQueryTimeIfLeavingNow()
  const routingQueryResult = routingQuery()

  // If mode combination is not valid (i.e. produced no query), alert the user.
  if (routingQueryResult === RoutingQueryCallResult.INVALID_MODE_SELECTION) {
    window.alert(
      intl.formatMessage({
        id: 'components.BatchSettings.invalidModeSelection'
      })
    )
  }
}
