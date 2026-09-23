import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reset } from '../api/Client'
import { historyQueryKey } from './UseHistory'

export const useResetHistory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: reset,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: historyQueryKey})
        }
    })
}