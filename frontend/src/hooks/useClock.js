import { useEffect, useState } from "react"

function pad(n) {
    return String(n).padStart(2, '0')
}

export const useClock = () => {
    const [now, setNow] = useState(() => new Date())

    // ticks once every second
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    return { time, date, dateTime: `${date} ${time}` }
}