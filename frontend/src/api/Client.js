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
//
// mediaType/mediaName are optional. mediaType="video" plus frameIndex/totalFrames
// tags a call as one frame of an uploaded video file, so the backend compiles
// all of that video's frames into a single history row. mediaType="stream" tags
// it as one tick of a live webcam session (grouped by mediaName, a session id);
// the backend buffers those too, and the caller must call finalizeStream once
// the session ends to compile them into a row. Omit both for a plain image upload.
export const detect = async (file, { signal, mediaType, mediaName, frameIndex, totalFrames } = {}) => {
    const formData = new FormData()
    formData.append(DETECT_FILE_FIELD, file)
    if (mediaType !== undefined) formData.append('media_type', mediaType)
    if (mediaName !== undefined) formData.append('media_name', mediaName)
    if (frameIndex !== undefined) formData.append('frame_index', frameIndex)
    if (totalFrames !== undefined) formData.append('total_frames', totalFrames)
    try {
        // No manual Content-Type: the browser must set it so the multipart boundary is included.
        const response = await api.post('/detect', formData, { signal })
        return response.data
    } catch (error) {
        logError("Image upload failed", error)
        throw error
    }
}

// finalizeStream → tells the backend a live webcam session has ended, so it can
// compile that session's buffered ticks into a single history row.
export const finalizeStream = async (mediaName) => {
    try {
        const response = await api.post('/detect/finalize', { media_name: mediaName })
        return response.data
    } catch (error) {
        logError("Failed to finalize stream session", error)
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
