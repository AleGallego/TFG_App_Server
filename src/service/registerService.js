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


const registerService = {

    registerUsers: async (data) => {
        const tablas = excelToJson(data)
        const alumnos = tableMaps.mapAlumnos(tablas.Alumnos)

        const nuevosAlumnos = await prisma.alumnos.createMany({ // Solo añadir usuarios que no estén ya
            data: alumnos,
            skipDuplicates: true
        })

        // Recuperar IDs generados
        const alumnosID = await prisma.alumnos.findMany({
            where: { dni: { in: alumnos.map(a => a.dni) } },
            select: { id: true, dni: true }
        });

        await registrarMatricula(tablas, alumnosID) // Solo lo debería de hacer para los usuarios que no estén ya matriculados
        return nuevosAlumnos
    }
}
module.exports = registerService

