export const DT = 1 / 60;
export const FIELD_SIZE = 100;
export const MAX_SIMULATION_TIME = 300;

export interface UnitAttributes {
    maxHealth: number;
    attackDamage: number;
    attackRange: number;
    attackCooldown: number;
    speed: number;
}

export interface Unit {
    type: string;
    x: number;
    currentHealth: number;
    currentAttackCooldown: number;
    attributes: UnitAttributes;
}

export type UnitTemplates = Record<string, UnitAttributes>;

export const DEFAULT_UNIT_TEMPLATES: UnitTemplates = {
    swordsman: {
        maxHealth: 120,
        attackDamage: 12,
        attackRange: 6,
        attackCooldown: 0.55,
        speed: 20,
    },
    archer: {
        maxHealth: 80,
        attackDamage: 9,
        attackRange: 22,
        attackCooldown: 0.9,
        speed: 16,
    },
};

export function createUnit(type: string, x: number, templates: UnitTemplates = DEFAULT_UNIT_TEMPLATES): Unit {
    const attributes = templates[type];
    if (!attributes) {
        throw new Error(`Unknown unit type: ${type}`);
    }
    return {
        type,
        x,
        currentHealth: attributes.maxHealth,
        currentAttackCooldown: 0,
        attributes,
    };
}

export function distanceBetween(unit1: Unit, unit2: Unit): number {
    return Math.abs(unit1.x - unit2.x);
}

export function enemyInRange(unit: Unit, enemy: Unit): boolean {
    return distanceBetween(unit, enemy) <= unit.attributes.attackRange;
}

export function unitCanAttack(unit: Unit): boolean {
    return unit.currentAttackCooldown <= 0;
}

export function processAttack(unit: Unit, enemy: Unit): boolean {
    if (!unitCanAttack(unit)) return false;
    enemy.currentHealth -= unit.attributes.attackDamage;
    unit.currentAttackCooldown = unit.attributes.attackCooldown;
    return true;
}

export function moveUnit(unit: Unit, direction: 1 | -1): void {
    unit.x += unit.attributes.speed * direction * DT;
}

export function simulateFight(
    unitType1: string,
    unitType2: string,
    templates: UnitTemplates = DEFAULT_UNIT_TEMPLATES
): { time: number; unit1: Unit; unit2: Unit } {
    const unit1 = createUnit(unitType1, 0, templates);
    const unit2 = createUnit(unitType2, FIELD_SIZE, templates);
    let time = 0;

    while (unit1.currentHealth > 0 && unit2.currentHealth > 0 && time < MAX_SIMULATION_TIME) {
        if (enemyInRange(unit1, unit2)) {
            processAttack(unit1, unit2);
        } else {
            moveUnit(unit1, 1);
        }

        if (enemyInRange(unit2, unit1)) {
            processAttack(unit2, unit1);
        } else {
            moveUnit(unit2, -1);
        }

        time += DT;
        unit1.currentAttackCooldown = Math.max(0, unit1.currentAttackCooldown - DT);
        unit2.currentAttackCooldown = Math.max(0, unit2.currentAttackCooldown - DT);
    }

    return { time, unit1, unit2 };
}
