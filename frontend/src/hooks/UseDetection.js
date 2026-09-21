import {useMutation} from '@tanstack/react-query'
import { detect } from '../api/Client'

// Wraps /detect as a mutation because it is user-triggered and saves detection history.
// mutate(file) takes the image File itself; the multipart body is built in api/Client.js.
// Usage: const { mutate, mutateAsync, isPending, isError, error, data } = useDetection()
export const useDetection = () => {
    return useMutation({
        mutationFn: (file) => detect(file)
    })
}