const mongoose = require('mongoose')

const Usuario = mongoose.model('Usuario', {
    id: String,
    nome: String,
    email: String,
    telefone: String,
    senha: String,
    salt: String,
})

module.exports = Usuario