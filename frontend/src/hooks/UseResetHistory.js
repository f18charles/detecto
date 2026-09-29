import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reset } from '../api/Client'
import { historyQueryKey } from './useHistory'

export const useResetHistory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: reset,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: historyQueryKey})
        }
    })
}