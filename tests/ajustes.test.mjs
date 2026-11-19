import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(fileURLToPath(new URL('../src/services/ajustes.ts', import.meta.url)), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const all = { canAdd: true, canEdit: true, canDelete: true };
function setup({ configs = [], turnos = [], fail = () => false } = {}) {
    const calls = [];
    const apiClient = Object.fromEntries(['GET', 'POST', 'PUT', 'DELETE'].map(method => [method, async (path, options) => {
        const call = { method, path, options };
        calls.push(call);
        if (fail(call)) throw new Error('Solicitud rechazada');
        const data = path === '/api/v1/grado-dia-config' ? configs : path === '/api/v1/seccion-turno' ? turnos : [];
        return { data: method === 'GET' ? data : null };
    }]));
    const executeRequest = async operation => (await operation()).data;
    const client = { apiClient, executeRequest, executeRead: (_path, operation) => executeRequest(operation) };
    const exports = {};
    vm.runInNewContext(compiled, { exports, Error, require: () => client });
    return { service: exports, calls };
}

test('los CRUD de ajustes usan las rutas nuevas y aceptan confirmaciones sin registro', async () => {
    const { service, calls } = setup();
    for (const [resource, body] of Object.entries({ sede: { nombre_sede: 'Sede A' }, turno: { nombre: 'Mañana' }, grado: { numero: 1 }, seccion: { nombre: 'A', id_grado: 2, id_sede: 3 } })) {
        await service.ajustesCrud[resource].create(body);
        await service.ajustesCrud[resource].update(99, body);
        await service.ajustesCrud[resource].delete(99);
        const batch = calls.slice(-3);
        assert.equal(batch[0].path, `/api/v1/${resource}`);
        assert.equal(batch[1].method, 'PUT');
        assert.equal(batch[1].options.params.path.pk, 99);
        assert.equal(batch[2].method, 'DELETE');
        assert.equal(batch[2].options.params.path.pk, 99);
    }
});

test('la carga omite recursos sin permiso y nunca usa la ruta colegio anterior', async () => {
    const { service, calls } = setup();
    const result = await service.getAjustesData(resource => resource === 'sede');
    assert.deepEqual(calls.map(c => c.path), ['/api/v1/sede']);
    assert.equal(result.secciones.length, 0);
});

test('un error de carga se propaga en lugar de aparentar datos vacíos', async () => {
    const { service } = setup({ fail: call => call.method === 'GET' });
    await assert.rejects(service.getAjustesData(() => true), /rechazada/);
});

test('los bloques existentes se actualizan con PUT conservando el ID', async () => {
    const { service, calls } = setup({ configs: [{ id: 99, id_grado: 2, id_dia: 3, bloques_dia: 6 }] });
    await service.saveGradoDiaConfig(2, 3, '8', all);
    assert.deepEqual(calls.map(c => c.method), ['GET', 'PUT']);
    assert.equal(calls[1].options.params.path.pk, 99);
    assert.equal(calls[1].options.body.bloques_dia, 8);
});

test('un PUT fallido no elimina la configuración anterior', async () => {
    const { service, calls } = setup({ configs: [{ id: 99, id_grado: 2, id_dia: 3, bloques_dia: 6 }], fail: call => call.method === 'PUT' });
    await assert.rejects(service.saveGradoDiaConfig(2, 3, 8, all), /rechazada/);
    assert.deepEqual(calls.map(c => c.method), ['GET', 'PUT']);
});

test('poner cero elimina solo el registro del grado y día seleccionados', async () => {
    const { service, calls } = setup({ configs: [{ id: 99, id_grado: 2, id_dia: 3, bloques_dia: 6 }, { id: 100, id_grado: 2, id_dia: 4, bloques_dia: 6 }] });
    await service.saveGradoDiaConfig(2, 3, 0, all);
    assert.deepEqual(calls.map(c => c.method), ['GET', 'DELETE']);
    assert.equal(calls[1].options.params.path.pk, 99);
});

test('una configuración ausente se crea, mientras cero y valores sin cambio no escriben', async () => {
    const create = setup();
    await create.service.saveGradoDiaConfig(2, 3, 6, all);
    assert.equal(create.calls[1].method, 'POST');
    assert.equal(create.calls[1].options.body.id_grado, 2);
    const empty = setup();
    await empty.service.saveGradoDiaConfig(2, 3, 0, all);
    assert.equal(empty.calls.length, 1);
    const same = setup({ configs: [{ id: 99, id_grado: 2, id_dia: 3, bloques_dia: 6 }] });
    await same.service.saveGradoDiaConfig(2, 3, 6, all);
    assert.equal(same.calls.length, 1);
});

test('no se envían cantidades vacías, decimales, negativas o fuera del rango', async () => {
    for (const value of ['', '2.5', -1, 16, '6x']) {
        const { service, calls } = setup();
        await assert.rejects(service.saveGradoDiaConfig(2, 3, value, all), /entero/);
        assert.equal(calls.length, 0);
    }
});

test('cada operación de bloques comprueba el permiso requerido', async () => {
    const { service, calls } = setup({ configs: [{ id: 99, id_grado: 2, id_dia: 3, bloques_dia: 6 }] });
    await assert.rejects(service.saveGradoDiaConfig(2, 3, 8, { ...all, canEdit: false }), /permiso/);
    await assert.rejects(service.saveGradoDiaConfig(2, 3, 0, { ...all, canDelete: false }), /permiso/);
    await assert.rejects(service.saveGradoDiaConfig(2, 4, 6, { ...all, canAdd: false }), /permiso/);
    assert.ok(calls.every(c => c.method === 'GET'));
});

test('asignar turno actualiza y crea días antes de eliminar los deshabilitados', async () => {
    const { service, calls } = setup({ turnos: [{ id: 90, id_seccion: 10, id_dia: 1, id_turno: 2 }, { id: 91, id_seccion: 10, id_dia: 5, id_turno: 2 }] });
    await service.syncTurnoSeccion(10, 3, [1, 2], all);
    assert.deepEqual(calls.map(c => c.method), ['GET', 'PUT', 'POST', 'DELETE']);
    assert.equal(calls[1].options.params.path.pk, 90);
    assert.equal(calls[2].options.body.id_dia, 2);
    assert.equal(calls[3].options.params.path.pk, 91);
});

test('si falla un nuevo día no se borran las asignaciones anteriores', async () => {
    const { service, calls } = setup({ turnos: [{ id: 90, id_seccion: 10, id_dia: 1, id_turno: 2 }, { id: 91, id_seccion: 10, id_dia: 5, id_turno: 2 }], fail: c => c.method === 'POST' });
    await assert.rejects(service.syncTurnoSeccion(10, 3, [1, 2], all), /Se aplicaron 1 cambios/);
    assert.ok(calls.every(c => c.method !== 'DELETE'));
});

test('los permisos del cambio completo de turno se comprueban antes de escribir', async () => {
    const { service, calls } = setup({ turnos: [{ id: 90, id_seccion: 10, id_dia: 1, id_turno: 2 }, { id: 91, id_seccion: 10, id_dia: 5, id_turno: 2 }] });
    await assert.rejects(service.syncTurnoSeccion(10, 3, [1, 2], { ...all, canDelete: false }), /permiso/);
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('sin días configurados no se asigna turno a toda la semana por defecto', async () => {
    const { service, calls } = setup();
    await assert.rejects(service.syncTurnoSeccion(10, 3, [], all), /Configura/);
    assert.equal(calls.length, 0);
});

test('repetir la misma asignación no escribe ni afecta otra sección', async () => {
    const { service, calls } = setup({ turnos: [{ id: 90, id_seccion: 10, id_dia: 1, id_turno: 3 }, { id: 91, id_seccion: 11, id_dia: 1, id_turno: 2 }] });
    await service.syncTurnoSeccion(10, 3, [1, 1], all);
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('los duplicados de configuración y de turno se informan sin escribir', async () => {
    const { service, calls } = setup({ configs: [{ id: 1, id_grado: 2, id_dia: 3 }, { id: 2, id_grado: 2, id_dia: 3 }], turnos: [{ id: 3, id_seccion: 10, id_dia: 1 }, { id: 4, id_seccion: 10, id_dia: 1 }] });
    await assert.rejects(service.saveGradoDiaConfig(2, 3, 6, all), /duplicadas/);
    await assert.rejects(service.syncTurnoSeccion(10, 3, [1], all), /varios turnos/);
    assert.ok(calls.every(c => c.method === 'GET'));
});

test('el nombre oficial usa el contrato de plataforma y el colegio de la sesión', async () => {
    const { service, calls } = setup();
    await service.updateColegio(42, 'Colegio Demo');
    assert.equal(calls[0].path, '/api/v1/platform/tenant/{pk}');
    assert.equal(calls[0].options.params.path.pk, 42);
    assert.equal(calls[0].options.body.display_name, 'Colegio Demo');
});
