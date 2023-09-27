import styled from 'styled-components'

export const NearbySidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 3rem;
  overflow-y: scroll;
`

export const Card = styled.div`
  border-radius: 10px;
  background: white;
  color: #222;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  }
`

export const CardHeader = styled.div`
  font-size: 22px;
  padding: 1rem 1.2rem;
  font-weight: 600;
`

export const CardBody = styled.div`
  padding: 0rem 1.2rem;
  margin-bottom: 1rem;
`

export const StyledAlert = styled.div`
  /* 'clear: both' prevents the date selector from overlapping with the alert. */
  clear: both;
  margin: 0.1rem 0;
  padding: 5px 10px;
  text-align: center;
`

export const PatternRowContainer = styled.ul`
  list-style-type: none;
  padding-left: 0;
  border-radius: 10px;
  margin: 0;
  box-shadow: 2px 2px 5px 1px rgb(0 0 0/10%);
`
export const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
`
