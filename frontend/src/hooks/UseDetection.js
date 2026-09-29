import {useMutation} from '@tanstack/react-query'
import { detect } from '../api/Client'

// Wraps /detect as a mutation because it is user-triggered and saves detection history.
// Usage: const { mutate, mutateAsync, isPending, isError, error, data } = useDetection()
export const useDetection = () => {
    return useMutation({
        mutationFn: (formData) => detect(formData)
    })
}