import { useEffect, useRef, useState } from "react";

const delay_ms = 220

// `snapshot` is the content swapped onto the screen, while `transitionKey`
// decides *when* the swap happens. Fast-changing data (e.g. live stream frames)
// must not drive the key, otherwise the CRT flicker and the 220ms delay fire on
// every frame. Pass a stable key and keep the volatile content in the snapshot.
export const useScreenTransition = (snapshot, transitionKey) => {
    const [displayed, setDisplayed] = useState(snapshot);
    const [flicker, setFlicker] = useState(false);
    const isFirstRun = useRef(true);
    const timeoutRef = useRef(null);
    const rafRef = useRef(null);

    const key = transitionKey ?? JSON.stringify(snapshot)

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