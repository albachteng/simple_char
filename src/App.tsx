import './App.css'
import {level10, useChar} from './useChar'
import { Button } from '@mantine/core'

function App() {

  const strIntoDex = level10("fighter rogue", ["str", "str", "dex", "dex", "dex", "dex", "dex", "int", "int"], "str", "dex", "int", "two-hand", "heavy")
  const dexIntoStr = level10("rogue fighter", ["dex", "dex", "str", "str", "str", "str", "str", "int", "int"], "dex", "str", "int", "ranged", "heavy")
  const intIntoDex = level10("wizard dex", ["int", "int", "dex", "dex", "dex", "dex", "dex", "str", "str"], "int", "dex", "str", "staff", "none")
  const strIntoInt = level10("str gish", ["str", "str", "int", "int", "int", "int", "int", "dex", "dex"], "str", "int", "dex", "two-hand", "heavy")
  const dexIntoInt = level10("dex gish", ["dex", "dex", "int", "int", "int", "int", "int", "str", "str"], "dex", "int", "str", "ranged", "none")
  const intIntoStr = level10("wizard tank", ["int", "int", "str", "str", "str", "str", "str", "dex", "dex" ], "int", "str", "dex", "staff", "heavy")
  const intEven = level10("int hybrid", ["dex", "dex", "dex", "dex", "dex", "str", "str", "str", "str"], "int", "str", "dex", "one-hand", "heavy")
  const dexEven = level10("dex hybrid", ["int", "int", "int", "str", "str", "str", "str", "str", "str"], "dex", "int", "str", "one-hand", "heavy")
  const strEven = level10("str hybrid", ["dex", "dex", "dex", "dex", "dex", "int", "int", "int", "dex"], "str", "int", "dex", "one-hand", "heavy")

  const {char, hp, ac, str, int, dex} = useChar()
  return (
    <div>
      <div></div>
      <h1>Name: Some Name</h1>
      <div className="card">
        <h3>HP: {hp}</h3>
      </div>
      <div className="card">
        <h3>AC: {ac}</h3>
      </div>
      <div className="card">
        <h3>STR: {str}</h3>
        <h3>DEX: {dex}</h3>
        <h3>INT: {int}</h3>
      </div>
      <Button onClick={() => char.level_up("str")}>Level STR</Button>
      <Button onClick={() => char.level_up("dex")}>Level DEX</Button>
      <Button onClick={() => char.level_up("int")}>Level INT</Button>
      <p className=""></p>
    </div>
  )
}

export default App
