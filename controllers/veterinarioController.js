import Veterinario from "../models/Veterinario.js"
import generarJWT from "../helpers/generarJWT.js"
import generarId from "../helpers/generarId.js";
import emailRegistro from "../helpers/emailRegistro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";

const registrar = async (req, res) => {

    const { email, nombre } = req.body;

    const existeUsuario = await Veterinario.findOne({ email });

    if (existeUsuario) {
        const error = new Error("Usuario ya registrado");
        return res.status(400).json({ msg: error.message });
    }

    try {

        const veterinario = new Veterinario(req.body);
        const veterinarioGuardado = await veterinario.save();

        emailRegistro({
            email,
            nombre,
            token: veterinarioGuardado.token
        });

        res.json(veterinarioGuardado);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Hubo un error al registrar el usuario" });
    }
}

const perfil = (req, res) => {
    const { veterinario } = req;
    res.json(veterinario);
}

const confirmar = async (req, res) => {

    const { token } = req.params;

    try {
        const usuarioConfirmar = await Veterinario.findOne({ token });

        if (!usuarioConfirmar) {
            const error = new Error('Token no valido');
            return res.status(404).json({ msg: error.message })
        }

        usuarioConfirmar.token = null;
        usuarioConfirmar.confirmado = true;

        await usuarioConfirmar.save();

        return res.json({ msg: 'Usuario Confirmado Correctamente' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Hubo un error al confirmar el usuario" });
    }

}

const autenticar = async (req, res) => {

    const { email, password } = req.body;

    try {
        const usuario = await Veterinario.findOne({ email });

        if (!usuario) {
            const error = new Error("El Usuario no existe");
            return res.status(404).json({ msg: error.message });
        }

        if (!usuario.confirmado) {
            const error = new Error('Tu cuenta no ha sido confirmada');
            return res.status(403).json({ msg: 'Tu cuenta no esta confirmada' });
        }

        if (await usuario.comprobarPassword(password)) {
            res.json({
                _id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                token: generarJWT(usuario.id)
            });
        } else {
            console.log('password Incorrecto');
            return res.status(403).json({ msg: 'Password Incorrecto' });
        }

    } catch (error) {
        console.log(error);
    }

}

const olvidePassword = async (req, res) => {
    const { email } = req.body;

    const existeVeterinario = await Veterinario.findOne({ email });

    if (!existeVeterinario) {
        const error = new Error("No hay veterinario registrados con ese correo")
        return res.status(400).json({ msg: error.message });
    }

    try {
        existeVeterinario.token = generarId();
        await existeVeterinario.save();

        emailOlvidePassword({
            email,
            nombre: existeVeterinario.nombre,
            token: existeVeterinario.token
        })
        res.json({ msg: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.log(error)
    }
}
const comprobarToken = async (req, res) => {

    const { token } = req.params;

    const tokenValido = await Veterinario.findOne({ token });

    if (tokenValido) {
        return res.json({ msg: 'Token valido' });
    } else {
        const error = new Error("Token no valido");
        return res.status(400).json({ msg: error.message });
    }
}

const nuevoPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const usuarioVeterinario = await Veterinario.findOne({ token });
    if (!usuarioVeterinario) {
        const error = new Error("Hubo un error");
        return res.status(400).json({ msg: error.message });
    }

    try {
        usuarioVeterinario.token = null
        usuarioVeterinario.password = password;
        await usuarioVeterinario.save();
        res.status(200).json({ msg: "Password Modificado Correctamente" });

    } catch (error) {
        console.log(error);
    }
}

const actualizarPerfil = async (req, res) => {
    const id = req.params.id;
    const { nombre, email, web, telefono } = req.body;

    const veterinario = await Veterinario.findById(id);
    if (!veterinario) {
        const error = new Error("Hubo un error");
        return res.status(400).json({ msg: error.message })
    }

    if (veterinario.email !== req.body.email) {
        const existeEmail = await Veterinario.findOne({ email })

        if (existeEmail) {
            const error = new Error("Email en uso");
            return res.status(400).json({ msg: error.message });
        }
    }

    try {

        veterinario.nombre = nombre;
        veterinario.email = email;
        veterinario.web = web;
        veterinario.telefono = telefono;

        const veterinarioActualizado = await veterinario.save()
        res.json(veterinarioActualizado);
    } catch (error) {
        console.log(error)
    }
}

const actualizarPassword = async (req, res) => {

    const { id } = req.veterinario;
    const { pwd_actual, pwd_nuevo } = req.body

    const veterinario = await Veterinario.findById(id);
    if (!veterinario) {
        const error = new Error("Hubo un error");
        return res.status(400).json({ msg: error.message })
    }

    console.log(pwd_actual);
    if (await veterinario.comprobarPassword(pwd_actual)) {

        veterinario.password = pwd_nuevo;
        await veterinario.save();
        res.json({ msg: 'Password Almacenado Correctamente' })
    } else {
        const error = new Error("El Password Actual es Incorrecto");
        return res.status(400).json({ msg: error.message })
    }
}

export {
    registrar,
    perfil,
    confirmar,
    autenticar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    actualizarPerfil,
    actualizarPassword
}