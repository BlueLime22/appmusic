import { useState } from 'react'

export default function App() {
  const [isAan, setIsAan] = useState(false);

  return (
    <>
      <button
        type="button"
        className={isAan ? 'aan' : ''}
        onClick={() => setIsAan(!isAan)}
      />
    </>
  )
}
