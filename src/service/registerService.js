const prisma = require('../prismaClient.js');
const tableMaps = require('../utils/tableMaps.js')
const { excelToJson } = require('../utils/jsonConverter.js');



async function registrarMatricula(tablas, alumnosId) {
    const Asignatura = tablas.Asignatura.find(f => f.clave === "Asignatura:").valor
    const idAsignatura = await prisma.asignaturas.findFirst({
        where: {
            nombre: Asignatura,
        },
        select: {
            id: true
        }
    })

    // Grupo del alumno
    const gruposID = await registrarGrupo(tablas.Alumnos)

    const matriculas = tableMaps.mapMatricula(tablas.Asignatura, tablas.Alumnos, alumnosId, idAsignatura.id, gruposID)
    const nuevasMatriculas = await prisma.matricula.createMany({
        data: matriculas,
        skipDuplicates: true
    })

    return nuevasMatriculas
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


        await registrarMatricula(tablas, alumnosID) // Solo lo debería de hacer para los usuarios que no estén ya matriculados
        return {
            success: true,
            message: `Se han insertado ${nuevosAlumnos.count} alumnos correctamente. ${alumnosInvalidos.length ? alumnosInvalidos.length + " alumnos no se pudieron insertar." : ""}`,
            invalidos: alumnosInvalidos
        };
    }
}
module.exports = registerService

