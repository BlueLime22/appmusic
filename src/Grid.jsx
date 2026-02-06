import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const rijen = 8;
const kolommen = 24;

function createGrid() {
    return Array.from({ length: rijen }, () =>
        Array.from({ length: kolommen }, () => false)
    );
}

const notes = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];

export default function Grid() {
    const [grid, setGrid] = useState(createGrid());
    const [step, setStep] = useState(0);

    const synthRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prevStep => (prevStep + 1) % kolommen);
        }, 400);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();

        return () => {
            synthRef.current.dispose();
        };
    }, []);

    useEffect(() => {
        if (!synthRef.current) return;

        grid.forEach((row, rIndex) => {
            if (row[step]) {
                synthRef.current.triggerAttackRelease(
                    notes[rIndex],
                    '8n'
                );
            }
        });
    }, [step]);

    function toggleCell(row, col) {
        setGrid(prevGrid =>
            prevGrid.map((r, rIndex) =>
                rIndex === row
                    ? r.map((c, cIndex) => (cIndex === col ? !c : c))
                    : r
            )
        );
    }

    return (
        <div>
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex' }}>
                    {row.map((cell, colIndex) => (
                        <div
                            key={colIndex}
                            onClick={() => toggleCell(rowIndex, colIndex)}
                            style={{
                                width: 50,
                                height: 50,
                                margin: 2,
                                cursor: 'pointer',
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
    );
}