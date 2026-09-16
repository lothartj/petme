import { Room } from './components/Room/Room'

function getDisplayId(): number {
  const params = new URLSearchParams(window.location.search)
  return Number(params.get('displayId') ?? '0')
}

function App(): React.JSX.Element {
  return <Room displayId={getDisplayId()} width={window.innerWidth} height={window.innerHeight} />
}

export default App
