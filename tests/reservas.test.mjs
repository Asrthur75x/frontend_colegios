import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(fileURLToPath(new URL('../src/services/reservas.ts', import.meta.url)), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup(fail = () => false) {
    const calls = [];
    const apiClient = Object.fromEntries(['GET', 'POST', 'DELETE'].map(method => [method, async (path, options) => {
        const call = { method, path, options };
        calls.push(call);
        if (fail(call)) throw new Error('Solicitud rechazada');
        return { data: method === 'GET' ? [] : null };
    }]));
    const executeRequest = async operation => (await operation()).data;
    const client = { apiClient, executeRequest, executeRead: (_path, operation) => executeRequest(operation) };
    const exports = {};
    vm.runInNewContext(compiled, { exports, Error, require: () => client });
    return { service: exports, calls };
}
const form = () => ({
    sedes: [10, 11], id_dia: '20', id_turno: '30', nombre_actividad: ' Formación ',
    grados: [40], opciones_slots: [[3, 2], [5]],
});

test('el payload usa slots anidados y crea una reserva por sede sin mutar el formulario', () => {
    const { service } = setup();
    const input = form();
    const before = JSON.stringify(input);
    const payloads = service.buildReservaPayloads(input, 6);
    assert.equal(payloads.length, 2);
    assert.equal(payloads[0].id_sede, 10);
    assert.equal(payloads[1].id_sede, 11);
    assert.equal(payloads[0].nombre, 'Formación');
    assert.equal(payloads[0].id_dia, 20);
    assert.equal(payloads[0].id_turno, 30);
    assert.equal(JSON.stringify(payloads[0].opciones[0].slots), '[{"nro_bloque":2},{"nro_bloque":3}]');
    assert.equal(payloads[0].opciones[1].nro_opcion, 2);
    assert.equal(JSON.stringify(input), before);
});

test('se deduplican las sedes y los grados seleccionados', () => {
    const { service } = setup();
    const input = { ...form(), sedes: [10, 10], grados: [40, 40] };
    const payloads = service.buildReservaPayloads(input, 6);
    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].grados.length, 1);
});

test('no se envían alternativas vacías, discontinuas, repetidas ni fuera del rango actual', () => {
    const { service } = setup();
    for (const opciones_slots of [[], [[]], [[1, 3]], [[2, 2]], [[2, 3], [3, 2]], [[0]], [[7]], [[1.5]]]) {
        const input = { ...form(), opciones_slots };
        assert.ok(service.validateReserva(input, 6).opciones_slots);
        assert.throws(() => service.buildReservaPayloads(input, 6));
    }
});

test('un cambio de día o grados impide guardar los bloques que dejaron de existir', () => {
    const { service } = setup();
    assert.ok(service.validateReserva(form(), 2).opciones_slots);
    assert.ok(service.validateReserva(form(), 0).opciones_slots);
});

test('se validan los datos generales antes de crear reservas', () => {
    const { service } = setup();
    const errors = service.validateReserva({ ...form(), sedes: [], id_dia: '', id_turno: '', grados: [], nombre_actividad: ' ' }, 6);
    for (const key of ['sedes', 'id_dia', 'id_turno', 'grados', 'nombre_actividad']) assert.ok(errors[key]);
});

test('el rango de bloques corresponde al día y los grados elegidos', () => {
    const { service } = setup();
    const configs = [
        { id_dia: 20, id_grado: 40, bloques_dia: 6 },
        { id_dia: 20, id_grado: 41, bloques_dia: 8 },
        { id_dia: 21, id_grado: 40, bloques_dia: 9 },
    ];
    assert.equal(service.maxBloquesReserva(20, [40], configs), 6);
    assert.equal(service.maxBloquesReserva(20, [40, 41], configs), 8);
    assert.equal(service.maxBloquesReserva(22, [40], configs), 0);
});

test('crear acepta la confirmación sin registro de la ruta nueva', async () => {
    const { service, calls } = setup();
    const result = await service.createReservas(service.buildReservaPayloads(form(), 6));
    assert.equal(JSON.stringify(result.saved), '[10,11]');
    assert.equal(result.failed.length, 0);
    assert.ok(calls.every(c => c.method === 'POST' && c.path === '/api/v1/bloque-reservado'));
});

test('los resultados parciales conservan las sedes guardadas y permiten reintentar solo las fallidas', async () => {
    const { service, calls } = setup(c => c.options?.body?.id_sede === 11);
    const result = await service.createReservas(service.buildReservaPayloads(form(), 6));
    assert.equal(JSON.stringify(result.saved), '[10]');
    assert.equal(result.failed[0].id_sede, 11);
    assert.match(result.failed[0].message, /rechazada/);
    const pending = { ...form(), sedes: result.failed.map(item => item.id_sede) };
    const retry = service.buildReservaPayloads(pending, 6);
    assert.equal(retry.length, 1);
    assert.equal(retry[0].id_sede, 11);
    assert.equal(calls.length, 2);
});

test('eliminar usa el ID de la reserva y propaga los errores', async () => {
    const { service, calls } = setup(c => c.method === 'DELETE');
    await assert.rejects(service.deleteReserva(99), /rechazada/);
    assert.equal(calls[0].path, '/api/v1/bloque-reservado/{pk}');
    assert.equal(calls[0].options.params.path.pk, 99);
});

test('una carga fallida no se presenta como una lista vacía', async () => {
    const { service } = setup(c => c.method === 'GET');
    await assert.rejects(service.listReservasData(), /rechazada/);
});
