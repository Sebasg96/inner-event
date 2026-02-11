const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantId = process.argv[2];
    if (!tenantId) {
        console.error("Please provide tenantId");
        return;
    }

    const purpose = await prisma.purpose.findFirst({
        where: { tenantId, type: 'COMPANY' },
        include: {
            megas: {
                include: {
                    objectives: {
                        include: {
                            keyResults: true,
                            childObjectives: {
                                include: {
                                    keyResults: true,
                                    childObjectives: {
                                        include: {
                                            keyResults: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!purpose) {
        console.log("No purpose found");
        return;
    }

    console.log(`Checking weights for Purpose: ${purpose.statement}`);
    purpose.megas.forEach(mega => {
        console.log(`  MEGA: ${mega.statement}`);
        const scanObj = (obj, indent = "    ") => {
            console.log(`${indent}Objective: ${obj.statement} (Weight: ${obj.weight})`);
            obj.keyResults.forEach(kr => {
                console.log(`${indent}  KR: ${kr.statement} (Weight: ${kr.weight})`);
            });
            if (obj.childObjectives) {
                obj.childObjectives.forEach(child => scanObj(child, indent + "    "));
            }
        };
        mega.objectives.forEach(obj => scanObj(obj));
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
