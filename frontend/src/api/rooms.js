import client from './client.js'

export const getRooms = () => client.get('/rooms').then(r => r.data)

export const createRoom = (data) => client.post('/rooms', data).then(r => r.data)

export const updateRoom = (id, data) => client.put(`/rooms/${id}`, data).then(r => r.data)

export const deleteRoom = (id) => client.delete(`/rooms/${id}`).then(r => r.data)
