import client from './client.js'

export const getDJs = (params) => client.get('/djs', { params }).then(r => r.data)

export const getDJ = (id) => client.get(`/djs/${id}`).then(r => r.data)

export const createDJ = (data) => client.post('/djs', data).then(r => r.data)

export const updateDJ = (id, data) => client.put(`/djs/${id}`, data).then(r => r.data)

export const deleteDJ = (id) => client.delete(`/djs/${id}`).then(r => r.data)

export const getDJStats = (id) => client.get(`/djs/${id}/stats`).then(r => r.data)

export const checkRepeat = (djId, roomId) =>
  client.get('/events/check-repeat', { params: { dj_id: djId, room_id: roomId } }).then(r => r.data)
