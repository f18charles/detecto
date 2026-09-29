import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 50000
})

// Name of the multipart field the backend's /detect endpoint reads the image from.
// This must match the parameter name in the FastAPI route, e.g.
//   async def detect(file: UploadFile = File(...))   ->  'file'
// A mismatch is what produces "422 Unprocessable Entity" (field required).
export const DETECT_FILE_FIELD = 'file'

const logError = (message, error) => {
    // FastAPI puts the reason for a 422 in response.data.detail — log it so the
    // exact missing/invalid field is visible in the console.
    console.error(message, error.response?.status ?? '', error.response?.data ?? error.message)
}

// detect → uploads an image file (JPEG, PNG) via multipart/form-data and returns:
// { count, boxes: [{x, y, width, height, confidence}], average_confidence, inference_time_ms, processed_image }
// Box coordinates are in pixels of the original image.
export const detect = async (file, { signal } = {}) => {
    const formData = new FormData()
    formData.append(DETECT_FILE_FIELD, file)
    try {
        // No manual Content-Type: the browser must set it so the multipart boundary is included.
        const response = await api.post('/detect', formData, { signal })
        return response.data
    } catch (error) {
        logError("Image upload failed", error)
        throw error
    }
}

// history → retrieves past detections from storage. with filters
export const history = async (params) => {
    try {
        const response = await api.get('/history', { params })
        return response.data
    } catch (error) {
        logError("Failed to retrieve the history", error)
        throw error
    }
}

// reset → clears stored detection history.
export const reset = async () => {
    try {
        const response = await api.post('/reset')
        return response.data
    } catch (error) {
        logError("Failed to clear history", error)
        throw error
    }
}
