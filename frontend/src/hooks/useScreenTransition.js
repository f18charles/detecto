import { useEffect, useRef, useState } from "react";

const delay_ms = 220

export const useScreenTransition = (snapshot) => {
    const [displayed, setDisplayed] = useState(snapshot);
    const [flicker, setFlicker] = useState(false);
    const isFirstRun = useRef(true);
    const timeoutRef = useRef(null);
    const rafRef = useRef(null);

    const key = JSON.stringify(snapshot)

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }

        setFlicker(false)
        rafRef.current = requestAnimationFrame(() => setFlicker(true));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
        setDisplayed(snapshot);
    }, delay_ms);

    return () => {
        clearTimeout(timeoutRef.current);
        cancelAnimationFrame(rafRef.current);
    };
    }, [key])

    return { displayed, flicker, onFlickerEnd: () => setFlicker(false)}
}