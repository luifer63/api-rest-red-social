// importar modulos
const jwt = require('jwt-simple')
const moment = require('moment')
// importa clave secreta
const libJwt = require('../services/jwt')
const secret = libJwt.secret

// MIDDLEWARE de autenticacion

exports.auth = (req, res, next) => {

    // comprobar si llega cabecera de autenticacion
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "Error",
            message: "La petición no tiene la cabecera de autenticación"
        })
    }

    // limpiar token
    let token = req.headers.authorization.replace(/['"]+/g, '')
    // decodificar token

    try {
        let payload = jwt.decode(token, secret)

        // comprobar expiración token
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "Error",
                message: "Token expirado"
            })
        }

        // agregar datos del usuario al request
        req.user = payload

    } catch (error) {
        return res.status(404).send({
            status: "Error",
            message: "Token invalido",
            error
        })

    }

    

    // pasar a ejecucion de accion 
    next()

}

