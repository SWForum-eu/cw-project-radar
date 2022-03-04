const conn = new Mongo()
const db = conn.getDB('swforum-radar')

db.sequences.insert({ _id: 'project', seq: 0 })
db.sequences.insert({ _id: 'radar', seq: 0 })

db.users.insert({
    name: 'admin',
    email: 'rohan@swforum.eu',
    password: '$2a$12$.n4NvG1ok5vxZYhf032Mn.QK9ZX9tDs2Gs3LRkIq.9lqxwxYV9T8K',
    role: 'admin',
    active: true
})
