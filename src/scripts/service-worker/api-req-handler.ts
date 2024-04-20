const backendServerRoute = 'http://localhost:5000'

export const handleRecord = async (claim, summary, body, source) => {
    const counterargData = { inputClaim: claim, summary, body, source }
    try {
        const res = await fetch(backendServerRoute + '/api/counterarg/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(counterargData),
            mode: 'cors'
        })
        const data = await res.json()
        if (!res.ok) {
            console.log(data.message)
            return false
        } else {
            return data
        }
    } catch (error) {
        console.log(error.message)
        return false
    }
}

export const fetchUser = async () => {
    try {
        const res = await fetch(backendServerRoute + '/api/user/getuser', {
            method: 'GET',
            mode: 'cors'
        })
        const data = await res.json()
        if (!res.ok) {
            console.log(data.message)
            return false
        } else {
            return data
        }
    } catch (error) {
        console.log(error.message)
        return false
    }
}

export const fetchHandleLike = async dataBody => {
    try {
        const res = await fetch(backendServerRoute + '/api/counterarg/like', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataBody),
            mode: 'cors'
        })
        const data = await res.json()
        if (!res.ok) {
            console.log(data.message)
            return false
        } else {
            return true
        }
    } catch (error) {
        console.log(error.message)
        return false
    }
}
