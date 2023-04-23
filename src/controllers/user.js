// importar dependencias y modulos
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('../services/jwt')
const mongoosePaginate = require('mongoose-pagination')
const { count, exists } = require('../models/user')
const fs = require('fs')
const path = require('path')


const followService = require('../services/followService')
const follow = require('../models/follow')
const publication = require('../models/publication')
const validate = require('../helpers/validates')

// Acciones de prueba


const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "mensaje enviado desde controllers/user.js",
        usuario: req.user
    })
}

//registro usuarios

const register = async (req, res) => {
    // recoger datos peticion 
    let params = req.body
    // comprobar que llegan datos + validacion

    if (!params.name || !params.email || !params.password || !params.nick) {
        console.log('Validacion incorrecta')
        return res.status(404).json({
            message: 'Faltan datos por enviar',
            status: 'Error'
        })
    }
    // Validacion avanzada

    try {
        validate.validate(params)        
    } catch (error) {
        return res.status(400).json({
            status: 'Error',
            message: 'Validacion no superada'            
        })        
    }
    
    // crear objeto usuario

    // control usuarios duplicados
    await User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }
        ]
    }).exec().then(async (users) => {
        if (users && users.length >= 1) {
            return res.status(500).send({ status: 'error', message: 'El Usuario ya existe' })
        } else {
            // cifrar contraseña
            let pwd = await bcrypt.hash(params.password, 10)
            params.password = pwd
            let userToSave = new User(params)

            // guardar usuario en base de datos

            try {
                userToSave.save()
                // devolver resultado
                return res.status(200).json({
                    status: "success",
                    userToSave,
                    mensaje: "Usuario registrado con éxito"
                })

            } catch (error) {
                console.log(error)
                return res.status(500).json({
                    status: "Error",
                    mensaje: "No se creó el usuario"
                })
            }
        }
    })
}

const login = async (req, res) => {
    // recoger parámetros

    let params = req.body
    // buscar en bd

    if (!params.email || !params.password) {
        return res.status(400).send({
            message: 'Faltan datos por enviar',
            status: 'Error'
        })
    }

    await User.findOne({ email: params.email })
        .exec().then((user) => {
            if (!user) return res.status(404).send({ status: "Error", message: "No existe el usuario" })

            // comprobar su contraseña

            const pwd = bcrypt.compareSync(params.password, user.password)

            if (!pwd) {
                return res.status(404).send({ status: "Error", message: "No te has logueado correctamente" })
            }

            // conseguir token
            const token = jwt.createToken(user)

            // devolver datos usuario
            return res.status(200).send({
                status: 'success',
                message: 'acción de login',
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick
                },
                token
            })

        })
}

const profile = async (req, res) => {

    // recibir el parametro id del usuario por la URL
    const id = req.params.id

    // Consulta para sacar los datos del usuario 
    await User.findById(id).select({ password: 0, role: 0 })
        .exec().then(async (userProfile) => {
            if (!userProfile) return res.status(404).send({ status: "Error", message: "No existe el usuario" })

            // info de sefguimiento
            const followInfo = await followService.followThisUser(req.user.id, id)

            // devolver datos usuario
            // devolver informacion de follows


            return res.status(200).send({
                status: 'success',
                user: userProfile,
                following: followInfo.follow,
                follower: followInfo.follower
            })

        })
}

const list = async (req, res) => {
    // controlar la pagina
    let page = 1
    if (req.params.page) {
        page = req.params.page
    }
    page = parseInt(page)
    // consulta mongoose pagination

    let itemsPerPage = 5
    let usuarios = await User.find()
    let total = usuarios.length

    await User.find().select('-password -email -__v -role').sort('_id').paginate(page, itemsPerPage).then(async (users, error) => {

        if (!users || error) return res.status(404).send({ status: "Error", message: "No hay usuarios disponibles", error })

        // info de sefguimiento
        const followInfo = await followService.followUserIds(req.user.id)

        //devolver resultado(info de follows)
        return res.status(200).send({
            status: 'success',
            users,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            users_Following: followInfo.following,
            users_Follow_me: followInfo.followers 
        })
    })
}

const update = async (req, res) => {
    // recoger info del usuario a actualizar
    const userIdentity = req.user
    const userToUpdate = req.body

    // eliminar campos sobrantes

    delete userToUpdate.iat
    delete userToUpdate.exp
    delete userToUpdate.role
    delete userToUpdate.image
    // el usuario existe??

    await User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() }
        ]
    }).exec().then(async (users) => {
        // cifrar contraseña
        // si llega password cifrar

        let userIsset = false

        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true
        })

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })
        }

        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10)
            userToUpdate.password = pwd
        }else{
            delete userToUpdate.password
        }

        // guardar usuario en base de datos
        /// Buscar y actualizar

        try {
            let userUpdated = await User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true })

            return res.status(200).send({
                status: 'success',
                message: "Método de acutalizar usuario",
                user: userUpdated
            })

        } catch (error) {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al actualizar',
                error
            })
        }
    })
}

const upload = async (req, res) => {
    // recoger fichero y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "Error",
            message: "Petición no incluye imagen"
        })
    }
    // conseguir nombre archivo

    let image = req.file.originalname
    //extension del archivo
    const imageSplit = image.split('\.')
    const archivoExt = imageSplit[1]

    // si no es correcto borrar archivo
    if (archivoExt != "png" && archivoExt != "jpg"
        && archivoExt != "jpeg" && archivoExt != "gif") {
        // borrar archivo y dar respuesta
        const fileDeleted = fs.unlinkSync(req.file.path)
        return res.status(400).send({
            status: 'Error',
            message: "Extensión de archivo invalida"
        })
    }
    // si es correcto guardar imagen en bd
    try {
        let userUpdated = await User.findOneAndUpdate({_id: req.user.id}, { image: req.file.filename }, { new: true })

        // devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: "Actualización correcta de imagen",
            userUpdated
        })

    } catch (error) {
        // devolver error
        return res.status(500).send({
            status: 'Error',
            message: 'Error al actualizar',
            error
        })
    }

}


const avatar = async(req, res) => {
    // sacar el parametro de la URL
    const file = req.params.file
    // montar el path real

    const filePath = './src/uploads/avatars/' + file
    //console.log(filePath)

    // comprobar que existe el archivo	
	try{
		console.log("Estoy en el try")
		//let avatar = await fs.statSync(filePath)

		return res.sendFile(path.resolve(filePath))
		
	}catch{
		return res.status(404).send({ 
                status: 'Error',
                message: 'Archivo no existe',
				filePath
				 
            })	
	}   
}

const counters = async (req, res) =>{
    let userId = req.user.id

    if(req.params.id){
        userId = req.params.id
    }

    try {
        const following = await follow.count({'user': userId})
        const followed = await follow.count({'followed': userId})
        const publications = await publication.count({'user': userId})

        return res.status(200).send({ 
             status: 'success',
             userId,
             following,
             followed,
             publications
        }) 
        
    } catch (error) {
        return res.status(404).send({ 
            status: 'Error',
             message: 'Archivo no existe' 
        })        
    }
}

module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}