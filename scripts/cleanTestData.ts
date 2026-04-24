import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = process.argv[2];

    if (!tenantId) {
        console.error('Error: Debes proporcionar el ID del tenant.');
        console.error('Uso: npx tsx scripts/cleanTestData.ts <tenantId>');
        process.exit(1);
    }

    console.log(`\nIniciando limpieza de datos estructurados para el tenant: ${tenantId}`);
    console.log(`ADVERTENCIA: Esta acción eliminará todo excepto Users, DiscProfiles y el Tenant original.\n`);

    try {
        // Validar que el tenant existe
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { _count: { select: { users: true } } }
        });

        if (!tenant) {
            console.error(`Error: No se encontró ningún tenant con el ID ${tenantId}.`);
            process.exit(1);
        }

        console.log(`Tenant encontrado: "${tenant.name}" (${tenant.domain}) con ${tenant._count.users} usuarios.`);

        // Iniciar transacción interactiva para seguridad
        await prisma.$transaction(
            async (tx) => {
                // En un entorno de transacciones a veces basta con llamar deleteMany.
                // Prisma respeta las llaves foráneas desde la base de datos si las consultas se hacen en orden o si hay cascades habilitados.
                // Dado que hemos planteado un orden específico en el plan de implementación, procedemos en ese orden.

                console.log('--- Iniciando eliminación secuencial ---');

                // 1. Accesos estratégicos
                const accessCount = await tx.strategicAccess.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${accessCount.count} registros de Accesos Estratégicos.`);

                // 2. KanbanTasks (Dependen de Initiative, que tienen tenantId, pero la misma KanbanTask tiene tenantId)
                const kanbanCount = await tx.kanbanTask.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${kanbanCount.count} Kanban Tasks.`);

                // 3. Iniciativas
                const initCount = await tx.initiative.deleteMany({ where: { tenantId } });
                console.log(`Eliminadas ${initCount.count} Iniciativas.`);

                // 4. Actualizaciones de Key Results (No tienen tenantId directo, dependen del key result)
                // Eliminamos aquellos cuyo KeyResult asociado pertenece al tenant
                const activeKRs = await tx.keyResult.findMany({ select: { id: true }, where: { tenantId } });
                const krIds = activeKRs.map(kr => kr.id);

                let krUpdatesCount = 0;
                if (krIds.length > 0) {
                    const res = await tx.keyResultUpdate.deleteMany({
                        where: { keyResultId: { in: krIds } }
                    });
                    krUpdatesCount = res.count;
                }
                console.log(`Eliminadas ${krUpdatesCount} Actualizaciones de Key Results.`);

                // 5. Key Results
                const krCount = await tx.keyResult.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${krCount.count} Key Results.`);

                // 6. Objetivos
                const objCount = await tx.objective.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${objCount.count} Objetivos.`);

                // 7. Megas
                const megaCount = await tx.mega.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${megaCount.count} Megas.`);

                // 8. Propósitos
                const purpCount = await tx.purpose.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${purpCount.count} Propósitos.`);

                // 9. Ejes Estratégicos
                const axisCount = await tx.strategicAxis.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${axisCount.count} Ejes Estratégicos.`);

                // 10. Team Members (Dependen de Team, el TeamMember no tiene tenantId directo)
                const activeTeams = await tx.team.findMany({ select: { id: true }, where: { tenantId } });
                const teamIds = activeTeams.map(t => t.id);

                let tmCount = 0;
                if (teamIds.length > 0) {
                    const res = await tx.teamMember.deleteMany({
                        where: { teamId: { in: teamIds } }
                    });
                    tmCount = res.count;
                }
                console.log(`Eliminados ${tmCount} miembros de equipos.`);

                // 11. Equipos
                const tCount = await tx.team.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${tCount.count} Equipos.`);

                // 12. Rituales (Participantes, compromisos y logs se borran en cascada, o los borramos explícitamente primero si no hay cascade general para Ritual).
                // El esquema muestra onDelete: Cascade para las relaciones con ritual.
                const rCount = await tx.ritual.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${rCount.count} Rituales (y sus dependientes).`);

                // 13. Modelos Independientes
                const docCount = await tx.document.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${docCount.count} Documentos de conocimiento.`);

                const snapCount = await tx.analyticsSnapshot.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${snapCount.count} Snapshots de Analytics.`);

                const dcCount = await tx.distinctiveCapability.deleteMany({ where: { tenantId } });
                console.log(`Eliminadas ${dcCount.count} Capacidades Distintivas.`);

                const eiCount = await tx.emergentInsight.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${eiCount.count} Insigths Emergentes.`);

                const hcCount = await tx.hardChoice.deleteMany({ where: { tenantId } });
                console.log(`Eliminadas ${hcCount.count} Hard Choices.`);

                const mvCount = await tx.marketValueMetric.deleteMany({ where: { tenantId } });
                console.log(`Eliminadas ${mvCount.count} Métricas de Valor de Mercado.`);

                const mLogCount = await tx.mutationLog.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${mLogCount.count} Mutation Logs.`);

                const ovCount = await tx.organizationalValue.deleteMany({ where: { tenantId } });
                console.log(`Eliminados ${ovCount.count} Valores Organizacionales.`);

                const scCount = await tx.strategicConversation.deleteMany({ where: { tenantId } });
                console.log(`Eliminadas ${scCount.count} Conversaciones Estratégicas.`);

                const sgCount = await tx.strategicGoal.deleteMany({ where: { tenantId } });
                console.log(`Eliminadas ${sgCount.count} Metas Estratégicas (Cuantitativas).`);

                console.log('\n✅ Limpieza completada con éxito.');
                console.log('El tenant y sus usuarios han sido preservados.');
            },
            {
                timeout: 20000, // Dar 20s de margen por si la BDD es grande
                isolationLevel: 'Serializable'
            }
        );

    } catch (error) {
        console.error('\n❌ Error durante la limpieza de datos:');
        console.error(error);
        console.error('\nCualquier cambio fue revertido automáticamente por la transacción.');
    } finally {
        await prisma.$disconnect();
    }
}

main();
