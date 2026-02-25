import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

const rijen = 8
const kolommen = 24

function createGrid() {
    return Array.from({ length: rijen }, () =>
        Array.from({ length: kolommen }, () => false)
    )
}

const notes = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']

export default function App() {
    const [grid, setGrid] = useState(createGrid())
    const [step, setStep] = useState(0)
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [instrument, setInstrument] = useState(1)
    const [paused, setPaused] = useState(true)

    const synthRef = useRef(null)

    useEffect(() => {
        if (paused) return
        const interval = setInterval(() => {
            setStep(prevStep => (prevStep + 1) % kolommen)
        }, 400)

        return () => clearInterval(interval)
    }, [paused])

    useEffect(() => {
        let isMounted = true

        async function loadInstrument() {
            let synth
            if (instrument === 1) {
                synth = new Tone.PolySynth(Tone.Synth).toDestination()
            } else if (instrument === 2) {
                synth = new Tone.PolySynth(Tone.FMSynth).toDestination()
            } else if (instrument === 3) {
                synth = createViolin()
            } else {
                synth = new Tone.PolySynth(Tone.Synth).toDestination()
            }

            if (isMounted) synthRef.current = synth
        }

        loadInstrument()

        return () => {
            if (synthRef.current) synthRef.current.dispose()
            isMounted = false
        }
    }, [instrument])

    useEffect(() => {
        if (!synthRef.current) return

        grid.forEach((row, rIndex) => {
            if (row[step]) {
                synthRef.current.triggerAttackRelease(
                    notes[rIndex],
                    '8n'
                )
            }
        })
    }, [step])

    useEffect(() => {
        const handleMouseUp = () => setIsMouseDown(false)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    function toggleCell(row, col) {
        setGrid(prevGrid =>
            prevGrid.map((r, rIndex) =>
                rIndex === row
                    ? r.map((c, cIndex) => (cIndex === col ? !c : c))
                    : r
            )
        )
    }

    function createViolin() {
        const violin = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth"
            },
            envelope: {
                attack: 0.1,
                decay: 0.4,
                sustain: 0.5,
                release: 1.2
            }
        }).toDestination()

        return violin
    }

    return (
        <>
            <h1>AppMusic</h1>
            <div id='grid'>
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex' }}>
                        {row.map((cell, colIndex) => (
                            <div
                                key={colIndex}
                                onMouseDown={() => {
                                    setIsMouseDown(true)
                                    toggleCell(rowIndex, colIndex)
                                }}
                                onMouseEnter={() => {
                                    if (isMouseDown) {
                                        toggleCell(rowIndex, colIndex)
                                    }
                                }}
                                style={{
                                    width: 50, height: 50, margin: 2, cursor: 'pointer',
                                    backgroundColor:
                                        colIndex === step
                                            ? 'gray'
                                            : cell
                                                ? 'rgb(56, 154, 179)'
                                                : 'lightgray'
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div>
                <button onClick={() => setInstrument(1)} className={instrument === 1 ? 'aan' : ''}>Xylofoon</button>
                <button onClick={() => setInstrument(2)} className={instrument === 2 ? 'aan' : ''}>Synth</button>
                <button onClick={() => setInstrument(3)} className={instrument === 3 ? 'aan' : ''}>Violin</button>
            </div>
            <div>
                <button onClick={() => setPaused(!paused)}>{paused ? 'play' : 'pause'}</button>
                <button onClick={() => {setGrid(createGrid())}}>Reset</button>
            </div>
        </>
    )
}