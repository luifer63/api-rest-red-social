// importar modelo

const Follow = require('../models/follow')
const mongoosePaginate = require('mongoose-pagination')
//const User = require('../models/User')

// importar servicio 
const followService = require('../services/followService')

// Acciones de prueba

const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "mensaje enviado desde controllers/follow.js"
    })
}

// accion de guardar un follow(seguir)
const save = async (req, res) => {
    // conseguir datos body
    const params = req.body
    console.log(params.followed)
    //sacar  id del usuario identificado
    const identity = req.user

    // crear objeto modelo follow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    })

    console.log(userToFollow)

    // guardar objeto en bd

    try {
        await userToFollow.save()
        // devolver respuesta
        return res.status(200).send({
            status: 'success',
            identity: req.user,
        })

    } catch (error) {
        // devolver error
        return res.status(500).send({
            status: 'Error',
            message: 'Error al seguir',
            error
        })
    }
}

// accion borrar un follow(dejar de seguir)

const unFollow = async (req, res) => {

    // recoger el id del usuario identificado
    const userId = req.user.id

    // recoger el ide del usuario que sigo
    const followedId = req.params.id

    // find coincidencias y remove

    try {
        let followedStored = await Follow.find({
            "user": userId,
            "followed": followedId
        }).deleteMany()



        return res.status(200).send({
            status: 'success',
            message: 'Dejó de seguir',
            followedStored
        })

    } catch (error) {
        return res.status(400).send({
            status: 'Error',
            message: 'Error al dejar de seguir'
        })
    }
}
// Listado de usuarios siguiendo que cualquier usuario está siguiendo 
const following = async (req, res) =>{
    // sacar el id del usuario identificado
    let userId = req.user.id    

    // comprobar si me llega el id por parámetro en url
    if(req.params.id){
        userId = req.params.id
    }

    // comprobar si me llega la pagina, si no la pagina 1
    let page = 1
    if(req.params.page){
        page = req.params.page
    }

    // usuarios por pagina quiero mostrar 
    const itemsPerPage = 5    
    // find a follow, popular datos de los usuarios y paginar con mongoose paginate

    let follows = await Follow.find({user: userId})
    let total = follows.length

    try {
        let usersFollowing = await Follow.find({user: userId})
                                    .populate("user followed", "-password -role -__v -email")
                                    .paginate(page, itemsPerPage)
                                    .exec()

        let followUserIds = await followService.followUserIds(req.user.id)

         // que usuarios siguen a los dos usuarios
         // sacar array de los usuarios me siguen del otro usuario


        return res.status(200).send({
            status: 'success',
            message: 'Listado de usuarios siguiendo',
            total,
            page,
            pages: Math.ceil(total / itemsPerPage),
            itemsPerPage,
            users_Following: followUserIds.following,
            users_Follow_me: followUserIds.followers     

        })
        
    } catch (error) {
        return res.status(404).send({
            status: 'Error',
            message: 'Listado de usuarios siguiendo',
         
        })      
    }   
}


// listado de usuarios que siguen a cualquier otro usuario

const followers = async (req, res) =>{

    // sacar el id del usuario identificado
    let userId = req.user.id    

    // comprobar si me llega el id por parámetro en url
    if(req.params.id){
        userId = req.params.id
    }

    // comprobar si me llega la pagina, si no la pagina 1
    let page = 1
    if(req.params.page){
        page = req.params.page
    }

    // usuarios por pagina quiero mostrar 
    const itemsPerPage = 5    
    // find a follow, popular datos de los usuarios y paginar con mongoose paginate

    let follows = await Follow.find({followed: userId})
    let total = follows.length

    try {
        let usersFollowing = await Follow.find({followed: userId})
                                    .populate("user", "-password -role -__v -email")
                                    .paginate(page, itemsPerPage)
                                    .exec()

        let followUserIds = await followService.followUserIds(req.user.id)

         // que usuarios siguen a los dos usuarios
         // sacar array de los usuarios me siguen del otro usuario


        return res.status(200).send({
            status: 'success',
            message: 'Listado de usuarios que me siguen',
            total,
            page,
            pages: Math.ceil(total / itemsPerPage),            
            itemsPerPage,
            follows: usersFollowing,
            users_Following: followUserIds.following,
            users_Follow_me: followUserIds.followers     

        })
        
    } catch (error) {
        return res.status(404).send({
            status: 'Error',
            message: 'Listado de usuarios siguiendo',
         
        })      
    }   

}

module.exports = {
    pruebaFollow,
    save,
    unFollow,
    following,
    followers
}