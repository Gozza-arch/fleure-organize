import client from './client.js'

export const getArchives = (params) => client.get('/archives', { params }).then(r => r.data)

export const getArchiveStats = () => client.get('/archives/stats').then(r => r.data)
