import { useQuery } from '@tanstack/react-query'
import { history } from '../api/Client'

export const historyQueryKey = ['history']

export const useHistory = (params) => { // params added for filtering and incase pagination would be added later
    return useQuery({
        queryKey: params ? [...historyQueryKey, params] : historyQueryKey,
        queryFn: () => history(params)
    })
}