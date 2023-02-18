import express from "express";
const router = express.Router();
import session from 'express-session';
import bcrypt from 'bcrypt';
import {Usuario} from '../modules/usuarios.modules.js';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

//Obtiene la ruta login. Si estaba logueado te redirige al index y sino al login para ingresar usuario/contraseña
router.get('/login', async(req, res) => {
    if (req.session.login) {
        res.redirect('/api/usuario/login')
    } else {
        res.render('templates/login', {status: false})
    }
    
})

//Obtiene la ruta para registrarse.
router.get('/register', async(req, res) => {
        res.render('templates/register', {status: false})   
})

router.post('/register', async(req,res) => {
    let body = req.body;

    let { nombre, email, password, rol } = body;

    let usuario = new Usuario({
        nombre,
        email,
        password: bcrypt.hashSync(password, 10),
        rol
    });

    usuario.save();

    res.render('templates/finishregister')
});

/**
 * Cuando ingreso un usuario y contraseña los obtiene del body, para validarlos con los que tengo cargados en .env
 */
router.post('/login', async(req, res) => {
    let body = req.body;

    Usuario.findOne({ email: body.email}, (erro, usuarioDB) => {
        if (erro) {
            return res.status(500).json({
                ok: false,
                err: erro
            })
        }

        //Verifica que exista un usuario con el mail escrito en el form
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "Usuario o contraseña incorrectos"
                }
            });
        }

        //Valida que la contraseña escrita por el usuario sea la almacenada en la base
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "Usuario o contraseña incorrectos"
                }
            });
        }

        dotenv.config();
        //Genera el token de autenticación con JWT
        let token = jwt.sign({
            usuario: usuarioDB, 
        }, process.env.SEED_AUTENTICACION, {
            expiresIn: "24h"
        })

        req.session.login=true;
        res.redirect('/api/usuario')
    });    
})

//Obtiene la página inicial apenas entro al localhost, validada para habilitar inicio sesion
router.get('/', async(req, res) => {
    res.render('templates/home', {status: req.session.login})
})


//Cierra la sesion eliminando los datos y redifgiendo a página de logout
router.get('/logout', async(req, res) => {
    req.session.destroy( (err) => {
        if (err) {
            res.json(err);
        } else {
            res.render('templates/logout', {status: false});
        }
    })
})

export default router;