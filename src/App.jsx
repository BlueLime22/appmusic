import { useState, useEffect, useRef } from 'react' 
// https://react.dev/reference/react/useState
// https://react.dev/reference/react/useRef
// https://react.dev/reference/react/useEffect

import * as Tone from 'tone' 
//https://tonejs.github.io/

import { Slider } from 'primereact/slider' 
// https://primereact.org/
// https://primereact.org/slider/

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
    const [tempo, setTempo] = useState(180)

    const synthRef = useRef(null)

    // Deze useEffect runt bij het bouwen van het project, en bij elke keer als de variable paused of tempo veranderen.
    // Wanneer paused waar is, returnt de functie, en wordt de step niet verhoogt.
    // Anders wordt om de 60000 / tempo miliseconden de step met 1 verhoogt.
    // Wanneer de step aan het einde komt van de matrix (dus bij 24), wordt er met modulo ervoor gezorgt dat step weer terug zal gaan naar 0.
    // De return statement is in dit geval nodig om memmoryleaks te voorkomen. In de video hieronder wordt uitgelegt hoe de cleanup funtion werkt. 
    // https://www.youtube.com/watch?v=V8FvyuObouc
    useEffect(() => {
        if (paused) return
        const interval = setInterval(() => {
            setStep(prevStep => (prevStep + 1) % kolommen)
        }, 60000 / tempo) // interval is in miliseconden terwijl tempo in BPM is. De formule om dit om te rekenen is: ms = 60.000 / BPM.

        return () => clearInterval(interval)
    }, [paused, tempo])

    useEffect(() => {
        let isMounted = true // Doordat er een async functie is en we niet willen dat deze gerunt wordt wanneer de useEffect geunmount is,
                             // wordt er met deze variable gechecked of dat het veilig is om de functie te runnen.

        // Deze functie maakt de variable synth aan, en zet deze op het gewenste instrument.
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

            // Wanneer isMounted waar is en de dus useEffect in gebruik is wordt het instrument gelijk gezet aan de variable synth.
            if (isMounted) synthRef.current = synth
        }

        loadInstrument()

        return () => {
            if (synthRef.current) synthRef.current.dispose()
            isMounted = false // De useEffect is geunmount, dus we willen niet dat de functie gerunt wordt, dus isMounted wordt hier op false gezet.
        }
    }, [instrument])

    // Deze useEffect checked elke keer als step verandert of er blokjes aan staan, en zo ja, of die in de huidige kolom zitten.
    // Zo ja, dan wordt de noot gespeelt die uit  de lijst notes wordt gekozen met de lengte van een achtste.
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

    // Deze useEffect voegt een EventListener toe die checked of de muis opgetilt wordt.
    useEffect(() => {
        const handleMouseUp = () => setIsMouseDown(false)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // Deze functie verandert de cel van false naar true of van true naar false.
    function toggleCell(row, col) {
        setGrid(prevGrid =>
            prevGrid.map((r, rIndex) =>
                rIndex === row
                    ? r.map((c, cIndex) => (cIndex === col ? !c : c))
                    : r
            )
        )
    }

    // Deze functie returnt de variable violin, waarin dit instrument in staat opgeslagen.
    function createViolin() {
        const violin = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sawtooth"
            },
            envelope: {
                attack: 0.1,
                decay: 5,
                sustain: 0.4,
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
                    <div key={rowIndex} style={{ display:'flex'}}>
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
            <div style={{display: 'flex', alignItems: 'center', gap:'10px'}}>
                <button onClick={() => setInstrument(1)} className={instrument === 1 ? 'aan' : ''}>Xylofoon</button>
                <button onClick={() => setInstrument(2)} className={instrument === 2 ? 'aan' : ''}>Synth</button>
                <button onClick={() => setInstrument(3)} className={instrument === 3 ? 'aan' : ''}>Violin</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap:'10px'}}>
                <button onClick={() => setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button>
                <button onClick={() => { setGrid(createGrid()) }}>Reset</button>

                {/* https://www.youtube.com/watch?v=7B8EgSQM3k0 
                    https://primereact.org/slider/ */}
                <Slider className="slider" value={tempo} onChange={(e) => setTempo(e.value)} min={60} max={300} style={{width: '300px'}} />
                <p>{tempo} bpm</p>
            </div>
        </>
    )
}