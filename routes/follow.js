const express = require('express')
const router = express.Router()
const check = require('../middlewares/auth')
const FollowController = require('../controllers/follow')

//definir rutas

router.get("/prueba-follow", FollowController.pruebaFollow)
router.post("/save", check.auth, FollowController.save)
router.delete("/unfollow/:id", check.auth, FollowController.unFollow)
router.get("/following/:id?/:page?", check.auth, FollowController.following)
router.get("/followers/:id?/:page?", check.auth, FollowController.followers)

// exportar router

module.exports = router