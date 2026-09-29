import { useCallback, useEffect, useRef } from "react";

export function useFileUpload({ accept = 'image/*' } = {}) {
    const urlRef = useRef(null)

    const openFilePicker = useCallback(({ onFile, onCancel } = {}) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = accept
        input.style.display = 'none'

        let handled = false;
        const cleanup = () => {
            if (input.parentNode) document.body.removeChild(input)
        }

        input.addEventListener('change', (e) => {
            if (handled) return
            handled = true
            const chosen = e.target.files?.[0]
            cleanup()

            if (!chosen) {
                onCancel?.()
                return
            }

            if (urlRef.current) URL.revokeObjectURL(urlRef.current)
            const url = URL.createObjectURL(chosen)
            urlRef.current = url
            onFile?.(chosen, url)
        })

        input.addEventListener('cancel', () => {
            if (handled) return
            handled = true
            cleanup()
            onCancel?.()
        })

        document.body.appendChild(input)
        input.click()
    }, [accept])

    const revoke = useCallback(() => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
    }, []);

    // remove abandoned file 
    useEffect(() => {
        return () => {
            if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        }
    }, [])

    return { openFilePicker, revoke }
}