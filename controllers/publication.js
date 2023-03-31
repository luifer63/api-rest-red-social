const fs = require('fs')
const path = require('path')
const Publication = require('../models/publication')
const followService = require('../services/followService')


// Acciones de prueba

const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "mensaje enviado desde controllers/publication.js"
    })
}

// GUardar publicacion
const save = async (req, res) => {
    // recoger datos del body
    const params = req.body

    // si no llegan dar respuesta negativa
    if (!params.text) return res.status(400).send({ status: "Error", "message": "Debes enviar el texto de la publicación" })

    console.log(params.text);

    // crear y rellenar el objeto del modelo
    let newPublication = new Publication({
        user: req.user.id,
        text: params.text
    })



    // guardar el objeto  en bdd
    try {
        let publicationStored = await newPublication.save()
        // devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Publicacion guardada',
            publicationStored
        })

    } catch (error) {
        // devolver error
        return res.status(500).send({
            status: 'Error',
            message: 'No se ha guardado la publicacion',
            error
        })
    }
}

// Sacar una publicacion

const detail = async (req, res) => {

    // sacar id de publicaciion
    const publicaciionId = req.params.id

    // finde con la condicion del id

    try {
        let publication = await Publication.findById(publicaciionId)
        // devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Puedes mostrar publicación',
            publication
        })

    } catch (error) {
        return res.status(404).send({
            status: 'Error',
            message: 'No se encontró la publicacion',
        })
    }
}

// eliminar publicaciones

const remove = async (req, res) => {

    // sacat id de publicacion a eliminar
    const publicaciionId = req.params.id

    // find de pub y remove
    try {
        let publicationRemove = await Publication.find({ 'user': req.user.id, '_id': publicaciionId }).deleteOne()
        // devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Publicacion eliminada',
            publicationRemove
        })

    } catch (error) {
        return res.status(500).send({
            status: 'Error',
            message: 'No se puede eliminar publicacion',
        })
    }

}

// listar todas las publicaciones de un usuario

const user = async (req, res) => {
    /// sacar el id de usuario
    const userId = req.params.id

    // controlar la pagina
    let page = 1
    if (req.params.page) {
        page = req.params.page
    }
    page = parseInt(page)

    let itemsPerPage = 5
    let total = await Publication.find({ user: userId }).countDocuments()
    // find, populate, ordenar, paginar 
    if(total <= 0){
        return res.status(404).send({
           status: 'Error',
            message: 'No hay publicaciones para mostrar',            
        })
    }

    try {
        let userPublication = await Publication.find({ user: userId })
                                    .sort("-created_at")
                                    .populate("user", '-password -__v -role -email')
                                    .paginate(page, itemsPerPage)
                                    
                                    
        

        //devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Publicaciones del perfil de usuario',
            page,
            pages: Math.ceil(total / itemsPerPage),
            total,
            userPublication
        })

    } catch (error) {
        return res.status(404).send({
            status: 'Error',
            message: 'Publicacion no encontrada',            
        })
    }
}



// subir ficheros
const upload = async (req, res) => {
    // sacar publication id
    const publicaciionId = req.params.id
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
        let publicationUpdated = await Publication.findOneAndUpdate({'user': req.user.id, '_id': publicaciionId}, { file: req.file.filename }, { new: true })

        // devolver respuesta
        return res.status(200).send({
            status: 'success',
            message: "Actualización correcta de imagen",
            publication: publicationUpdated,
            file: req.file
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

// devolver archivos multimedia
const media = (req, res) => {
    // sacar el parametro de la URL
    const file = req.params.file
    // montar el path real

    const filePath = './uploads/publications/' + file
    console.log(filePath)

    // comprobar que existe el archivo

    fs.stat(filePath, (error, exists) => {
        if (exists){
            // devolver un file
            return res.sendFile(path.resolve(filePath))            
        }else {
            return res.status(404).send({ 
                status: 'Error',
                 message: 'Archivo no existe' 
            })
        } 
    })
}

// listar todas las publicaciones(FEED)
const feed = async (req, res) => {
    // sacar pagina actual
    let page = 1

    if(req.params.page){
        page = req.params.page
    }

    // establecer numero de elementos por pagina
    let itemsPerPage = 5
    //sacar un array de ids de usuarios que yo sigo como usuario identificado
    try {
        const myFollows = await followService.followUserIds(req.user.id)
        const total = await Publication.find({
            user: myFollows.following
        }).countDocuments()

        const publications = await Publication.find({
            user: myFollows.following
        }).populate('user', '-password -email -role -__v')
          .sort('-created_at')
          .paginate(page, itemsPerPage)

        return res.status(200).send({
            status: 'success',
            message: "Feed de publicaciones",
            total,
            page,
            pages: Math.ceil(total / itemsPerPage),
            myFollows: myFollows.following,
            publications
            
        })

       
        
    } catch (error) {
        return res.status(500).send({
            status: 'Error',
            message: "No se han listado publicaciones",
            error
            
        })
        
    }

    

    // find a publicaciones  (operador in), ordenar, popular y paginar



    
}

module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}