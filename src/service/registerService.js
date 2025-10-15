const prisma = require('../prismaClient.js');
const tableMaps = require('../utils/tableMaps.js')
const { excelToJsonRegister } = require('../utils/jsonConverter.js');



// ------------------ REGISTRO DE MATRÍCULAS Y DETECCIÓN DE CAMBIOS DE GRUPO ------------------
async function registrarMatricula(tablas, alumnosId, idAsignatura) {
    // Registrar/grabar grupos
    const gruposID = await registrarGrupo(tablas.Alumnos, idAsignatura.id);
    // Mapear las matrículas nuevas desde el Excel
    const matriculasExcel = tableMaps.mapMatricula(
        tablas.Asignatura,
        tablas.Alumnos,
        alumnosId,
        idAsignatura.id,
        gruposID
    );

    // Insertar las matrículas nuevas
    const nuevasMatriculas = await prisma.matricula.createMany({
        data: matriculasExcel,
        skipDuplicates: true
    });

    // ------------------ DETECTAR CAMBIOS DE GRUPO ------------------
    const cambiosGrupo = [];

    for (const mExcel of matriculasExcel) {
        const mBD = await prisma.matricula.findFirst({
            where: { id_alumno: mExcel.id_alumno, id_asignatura: idAsignatura.id },
            select: { id_grupo: true, alumnos: { select: { correo: true, uo: true } } }
        });

        if (mBD && mBD.id_grupo !== mExcel.id_grupo) {
            // Guardamos el cambio
            cambiosGrupo.push({
                id_alumno: mExcel.id_alumno,
                grupoAnterior: mBD.id_grupo,
                grupoNuevo: mExcel.id_grupo,
                correo: mBD.alumnos.correo
            });

            // Actualizar en BD
            await prisma.matricula.updateMany({
                where: { id_alumno: mExcel.id_alumno, id_asignatura: idAsignatura.id },
                data: { id_grupo: mExcel.id_grupo }
            });
        }
    }

    return { nuevasMatriculas, cambiosGrupo };
}

async function registrarGrupo(secondTable, idAsignatura) {

    const clasesID = await registrarClases(secondTable, idAsignatura);

    // Mapear grupos únicos
    const grupos = tableMaps.mapGrupo(secondTable,idAsignatura);
    if (!grupos || grupos.length === 0) return { gruposID: [], clasesID };
    const gruposParaInsert = grupos.map(g => ({ nombre: g.key ,id_asignatura: g.id_asignatura}));

    try {
        await prisma.grupo.createMany({
            data: gruposParaInsert,
            skipDuplicates: true
        });
    } catch (error) {
        console.log(error);
    }

    // 4) Recuperar los ids de los grupos recién insertados (por nombre = key)
    const gruposID = await prisma.grupo.findMany({
        where: { nombre: { in: gruposParaInsert.map(g => g.nombre) } },
        select: { id: true, nombre: true }
    });

    // Crear relaciones grupo-clases
    await asociarGrupoClases(grupos, gruposID, clasesID);

    return gruposID;
}

async function registrarClases(secondTable, idAsignatura) {
    const clases = tableMaps.mapClases(secondTable, idAsignatura);

    try {
        await prisma.clases.createMany({
            data: clases,
            skipDuplicates: true
        });
    } catch (error) {
        console.log(error);
    }

    // Recuperar IDs generados
    const clasesID = await prisma.clases.findMany({
        where: {
            OR: clases.map(c => ({
                nombre: c.nombre,
                tipo: c.tipo,
                id_asignatura: c.id_asignatura
            }))
        },
        select: {
            id: true,
            nombre: true,
            tipo: true,
            id_asignatura: true
        }
    });

    return clasesID;
}

async function asociarGrupoClases(gruposUnicos, gruposID, clasesID, ) {
    const relaciones = []; // { id_grupo, id_clase, id_asignatura }

    const tiposOrden = [
        "Clases Expositivas",
        "Prácticas de Aula/Semina",
        "Prácticas de Laboratorio",
        "Tutorías Grupales"
    ];
    // Para cada grupo único, buscamos el grupoId y asociamos las clases (si existen)
    for (const g of gruposUnicos) {
        const grupoEncontrado = gruposID.find(gr => gr.nombre === g.key);
        if (!grupoEncontrado) continue; // no debería ocurrir, pero por seguridad

        // g.clasesArr debe tener las 4 posiciones correspondientes al orden de tiposOrden
        // si mapGrupo no devuelve clasesArr, podemos reconstruirlo partiendo de g.key.split('|')
        const clasesArr = g.clasesArr || (g.key ? g.key.split("|") : []);

        tiposOrden.forEach((tipo, idx) => {
            const nombreClase = clasesArr[idx];
            if (!nombreClase) return; // si el campo venía vacío => no asociamos

            const claseMatch = clasesID.find(c =>
                c.tipo === tipo &&
                c.nombre === nombreClase
            );

            if (claseMatch) {
                relaciones.push({
                    id_grupo: grupoEncontrado.id,
                    id_clases: claseMatch.id
                });
            }
        });
    }

    if (relaciones.length > 0) {
        try {
            await prisma.grupo_clases.createMany({
                data: relaciones,
                skipDuplicates: true
            });
        } catch (err) {
            console.error("Error createMany grupo_clases:", err);
        }
    }
}

// Función para validar un alumno   (IR AMPLIANDO)
function validateAlumno(a) {
    const errores = [];
    if (!a.uo || a.uo.length !== 8) errores.push("UO debe tener 8 caracteres");
    if (!a.correo || !/^[\w-.]+@[\w-]+\.[a-z]{2,4}$/i.test(a.correo)) errores.push("Correo inválido");
    if (!a.dni || !/^\d{8}[A-Z]$/i.test(a.dni)) errores.push("DNI inválido");
    return errores;
}

async function alumnosDesmatriculados(alumnosValidados, idAsignatura) {

    const dnIsExcel = alumnosValidados.map(a => a.dni);

    // Buscar los alumnos matriculados en esa asignatura que ya no estén en el Excel
    const alumnosExistentes = await prisma.alumnos.findMany({
        where: {
            dni: { notIn: dnIsExcel },
            matricula: {
                some: { id_asignatura: idAsignatura }
            }
        },
        select: { id: true, dni: true, correo: true }
    });

    if (alumnosExistentes.length > 0) {
        await prisma.matricula.deleteMany({
            where: {
                id_alumno: { in: alumnosExistentes.map(a => a.id) },
                id_asignatura: idAsignatura
            }
        });
    }
    return alumnosExistentes.map(a => a.correo); // devolvemos los UOS eliminados
}

const registerService = {

    registerUsers: async (data) => {
        const tablas = excelToJsonRegister(data)
        const alumnos = tableMaps.mapAlumnos(tablas.Alumnos)
        const alumnosValidados = [];
        const alumnosInvalidos = [];

        // Validar alumnos
        alumnos.forEach(a => {
            const errores = validateAlumno(a);
            if (errores.length) alumnosInvalidos.push({ alumno: a.alumno, errores });
            else alumnosValidados.push(a);
        });

        if (alumnosValidados.length === 0) {
            return {
                success: false,
                message: `No se pudo insertar ningún alumno. Todos los registros tienen errores.`,
                invalidos: alumnosInvalidos
            };
        }

        // Insertar solo los que pasan validación
        const nuevosAlumnos = await prisma.alumnos.createMany({
            data: alumnosValidados,
            skipDuplicates: true
        });

        // Recuperar IDs generados
        const alumnosID = await prisma.alumnos.findMany({
            where: { dni: { in: alumnosValidados.map(a => a.dni) } },
            select: { id: true, dni: true }
        });

        // Obtener el id de la asignatura
        const Asignatura = tablas.Asignatura.find(f => f.clave === "Asignatura:").valor
        const idAsignatura = await prisma.asignaturas.findFirst({
            where: {
                nombre: Asignatura,
            },
            select: {
                id: true
            }
        })


        const { nuevasMatriculas, cambiosGrupo } = await registrarMatricula(tablas, alumnosID, idAsignatura);
        const eliminados = await alumnosDesmatriculados(alumnosValidados, idAsignatura.id);

        return {
            success: true,
            message: `
        Se han insertado ${nuevasMatriculas.count} alumnos correctamente.
        ${alumnosInvalidos.length ? alumnosInvalidos.length + " alumnos no se pudieron insertar." : ""}
        ${eliminados.length ? eliminados.length + " alumnos fueron eliminados." : ""}
        ${cambiosGrupo.length ? cambiosGrupo.length + " alumnos cambiaron de grupo." : ""}
    `,
            invalidos: alumnosInvalidos,
            eliminados,
            cambiosGrupo
        };
    }
}
module.exports = registerService

