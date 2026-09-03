import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    timeout: 50000
})

// detect → accepts an image file (JPEG, PNG) via multipart/form-data or base64, runs inference, returns:
// JSON with count, coordinates, and confidence per person.
// Processed image (base64 or file path).
export const detect = async (formData) => {
    try {
        const response = await api.post('/detect', formData, {
            headers: {"Content-Type": "multipart/form-data"}
        })
        return response.data
    } catch (error) {
        console.error("Image upload failed", error.message)
        throw error
    }
}

// history → retrieves past detections from storage.
export const history = async () => {
    try {
        const response = await api.get('/history')
        return response.data
    } catch (error) {
        console.error("Failed to retrieve the history")
        throw error
    }
}

// reset → clears stored detection history.
export const reset = async () => {
    try {
        const response = await api.delete('/reset')
        return response.data
    } catch (error) {
        console.error("Failed to clear history")
        throw error
    }
}
