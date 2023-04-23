const validator = require('validator')
const { default: isEmail } = require('validator/lib/isEmail')

const validate = (params) => {

    let name = !validator.isEmpty(params.name) &&
        validator.isLength(params.name, { min: 3, max: undefined }) &&
        validator.isAlpha(params.name, "es-ES")

    let surename = !validator.isEmpty(params.surename) &&
        validator.isLength(params.surename, { min: 3, max: undefined }) &&
        validator.isAlpha(params.surename, "es-ES")

    let nick = !validator.isEmpty(params.nick) &&
        validator.isLength(params.nick, { min: 2, max: undefined }) 

    let email = !validator.isEmpty(params.email) &&
        validator.isEmail(params.email) 
    
    let password = !validator.isEmpty(params.password)

    let bio = validator.isLength(params.bio, {min: undefined, max: 255})
 

    
    if (!name || !surename || !nick || !email || !password || !bio ) {
        throw new Error('No se ha superado la validación')
    }else {
        console.log("validación superada")
    }
}

module.exports = {
    validate
}