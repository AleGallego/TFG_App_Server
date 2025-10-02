const prisma = require('../prismaClient.js');
const tableMaps = require('../utils/tableMaps.js')
const { excelToJson } = require('../utils/jsonConverter.js');



// ------------------ REGISTRO DE MATRÍCULAS Y DETECCIÓN DE CAMBIOS DE GRUPO ------------------
async function registrarMatricula(tablas, alumnosId, idAsignatura) {
    // Registrar/grabar grupos
    const gruposID = await registrarGrupo(tablas.Alumnos);

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


async function registrarGrupo(secondTable) {
    const grupos = tableMaps.mapGrupo(secondTable)

    try {
        await prisma.grupo.createMany({
            data: grupos,
            skipDuplicates: true
        })
    } catch (error) {
        console.log(error)
    }

    // Recuperar IDs generados
    const gruposID = await prisma.grupo.findMany({
        where: {
            OR: grupos.map(g => ({
                clases_expositivas: g.clases_expositivas,
                practicas_aula: g.practicas_aula,
                practicas_laboratorio: g.practicas_laboratorio,
                tutorias_grupales: g.tutorias_grupales,
            }))
        },
        select: {
            id: true,
            clases_expositivas: true,
            practicas_aula: true,
            practicas_laboratorio: true,
            tutorias_grupales: true,
        }
    });
    return gruposID
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
        const tablas = excelToJson(data)
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

