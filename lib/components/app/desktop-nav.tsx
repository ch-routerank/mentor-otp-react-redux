import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Nav, Navbar, NavItem } from 'react-bootstrap'
import React from 'react'
import styled from 'styled-components'

import * as uiActions from '../../actions/ui'
import { accountLinks, getAuth0Config } from '../../util/auth'
import { DEFAULT_APP_TITLE } from '../../util/constants'
import InvisibleA11yLabel from '../util/invisible-a11y-label'
import NavLoginButtonAuth0 from '../user/nav-login-button-auth0'

import AppMenu, { Icon } from './app-menu'
import LocaleSelector from './locale-selector'
import ViewSwitcher from './view-switcher'

const NavItemOnLargeScreens = styled(NavItem)`
  display: block;
  @media (max-width: 768px) {
    display: none !important;
  }
`

const StyledNav = styled(Nav)`
  & > li svg {
    height: 18px;
  }
`

// Typscript TODO: otpConfig type
export type Props = {
  locale: string
  otpConfig: any
  popupTarget?: string
  setPopupContent: (url: string) => void
}

/**
 * The desktop navigation bar, featuring a `branding` logo or a `title` text
 * defined in config.yml, and a sign-in button/menu with account links.
 *
 * The `branding` and `title` parameters in config.yml are handled
 * and shown in this order in the navigation bar:
 * 1. If `branding` is defined, it is shown, and no title is displayed.
 *    (The title is still rendered for screen readers and browsers that lack image support.)
 * 2. If `branding` is not defined but if `title` is, then `title` is shown.
 * 3. If neither is defined, just show 'OpenTripPlanner' (DEFAULT_APP_TITLE).
 *
 * TODO: merge with the mobile navigation bar.
 */
const DesktopNav = ({
  locale,
  otpConfig,
  popupTarget,
  setPopupContent
}: Props) => {
  const {
    brandClickable,
    branding,
    persistence,
    title = DEFAULT_APP_TITLE
  } = otpConfig
  const showLogin = Boolean(getAuth0Config(persistence))

  const BrandingElement = brandClickable ? 'a' : 'div'

  const commonStyles = { marginLeft: 50 }
  const brandingProps = brandClickable
    ? {
        href: '/#/',
        style: {
          ...commonStyles,
          display: 'block',
          position: 'relative',
          zIndex: 10
        }
      }
    : { style: { ...commonStyles } }

  return (
    <header>
      <Navbar fluid inverse>
        <Navbar.Header
          style={{ position: 'relative', width: '100%', zIndex: 2 }}
        >
          <Navbar.Brand>
            <AppMenu />
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore The dynamic tag is causing some trouble */}
            <BrandingElement
              className={branding && `with-icon icon-${branding}`}
              {...brandingProps}
            >
              {/* A title is always rendered (e.g.for screen readers)
                  but is visually-hidden if a branding icon is used. */}
              <div className="navbar-title">{title}</div>
            </BrandingElement>
          </Navbar.Brand>

          <ViewSwitcher sticky />

          <StyledNav pullRight>
            {popupTarget && (
              <NavItemOnLargeScreens
                onClick={() => setPopupContent(popupTarget)}
              >
                <Icon iconType={popupTarget} />
                <InvisibleA11yLabel>
                  <FormattedMessage id={`config.popups.${popupTarget}`} />
                </InvisibleA11yLabel>
              </NavItemOnLargeScreens>
            )}
            <LocaleSelector />
            {showLogin && (
              <NavLoginButtonAuth0
                id="login-control"
                links={accountLinks}
                locale={locale}
                style={{ float: 'right' }}
              />
            )}
          </StyledNav>
        </Navbar.Header>
      </Navbar>
    </header>
  )
}

// connect to the redux store
// Typescript TODO: state type
const mapStateToProps = (state: any) => {
  return {
    locale: state.otp.ui.locale,
    otpConfig: state.otp.config,
    popupTarget: state.otp.config?.popups?.launchers?.toolbar
  }
}

const mapDispatchToProps = {
  setPopupContent: uiActions.setPopupContent
}

export default connect(mapStateToProps, mapDispatchToProps)(DesktopNav)
