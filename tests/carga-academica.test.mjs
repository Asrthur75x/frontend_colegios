import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(fileURLToPath(new URL('../src/services/carga-academica.ts', import.meta.url)), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(rows = [], fail = () => false) {
    const calls = [];
    const apiClient = Object.fromEntries(['GET', 'POST', 'DELETE'].map(method => [method, async (path, options) => {
        const call = { method, path, options };
        calls.push(call);
        if (fail(call)) throw new Error('Solicitud rechazada');
        return { data: method === 'GET' ? rows : null };
    }]));
    const executeRequest = async operation => (await operation()).data;
    const client = { apiClient, executeRequest, executeRead: (_path, operation) => executeRequest(operation) };
    const exports = {};
    vm.runInNewContext(compiled, {
        exports, require: path => path === './catalogs'
            ? { listAreas: async () => [], listCursos: async () => [] } : client,
    });
    return { service: exports, calls };
}

test('asignar acepta una confirmación sin registro y envía los IDs nuevos', async () => {
    const { service, calls } = setup();
    await service.setCursoAsignado(10, 20, true, { canAdd: true, canDelete: false });
    assert.deepEqual(calls.map(c => c.method), ['GET', 'POST']);
    assert.equal(calls[1].path, '/api/v1/profesor-curso');
    assert.equal(JSON.stringify(calls[1].options.body), JSON.stringify({ id_profesor: 10, id_curso: 20 }));
});

test('asignar no duplica una relación que ya existe en el servidor', async () => {
    const { service, calls } = setup([{ id: 99, id_profesor: 10, id_curso: 20 }]);
    await service.setCursoAsignado(10, 20, true, { canAdd: true, canDelete: true });
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('quitar usa el ID de la relación y conserva los otros cursos y profesores', async () => {
    const { service, calls } = setup([
        { id: 99, id_profesor: 10, id_curso: 20 },
        { id: 100, id_profesor: 11, id_curso: 20 },
        { id: 101, id_profesor: 10, id_curso: 21 },
    ]);
    await service.setCursoAsignado(10, 20, false, { canAdd: false, canDelete: true });
    assert.deepEqual(calls.map(c => c.method), ['GET', 'DELETE']);
    assert.equal(calls[1].path, '/api/v1/profesor-curso/{pk}');
    assert.equal(calls[1].options.params.path.pk, 99);
});

test('quitar limpia todas las relaciones duplicadas del mismo par', async () => {
    const { service, calls } = setup([
        { id: 99, id_profesor: 10, id_curso: 20 },
        { id: 100, id_profesor: 10, id_curso: 20 },
    ]);
    await service.setCursoAsignado(10, 20, false, { canAdd: false, canDelete: true });
    assert.deepEqual(calls.filter(c => c.method === 'DELETE').map(c => c.options.params.path.pk), [99, 100]);
});

test('una desasignación ya aplicada no escribe de nuevo', async () => {
    const { service, calls } = setup();
    await service.setCursoAsignado(10, 20, false, { canAdd: false, canDelete: true });
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('cada operación respeta su permiso independiente', async () => {
    const create = setup();
    await assert.rejects(create.service.setCursoAsignado(10, 20, true, { canAdd: false, canDelete: true }), /permiso/);
    const remove = setup([{ id: 99, id_profesor: 10, id_curso: 20 }]);
    await assert.rejects(remove.service.setCursoAsignado(10, 20, false, { canAdd: true, canDelete: false }), /permiso/);
    assert.equal(create.calls.length, 1);
    assert.equal(remove.calls.length, 1);
});

test('una lectura fallida no se interpreta como ausencia de relaciones', async () => {
    const { service, calls } = setup([], call => call.method === 'GET');
    await assert.rejects(service.setCursoAsignado(10, 20, true, { canAdd: true, canDelete: true }), /rechazada/);
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('las escrituras fallidas se propagan a la pantalla', async () => {
    const create = setup([], call => call.method === 'POST');
    await assert.rejects(create.service.setCursoAsignado(10, 20, true, { canAdd: true, canDelete: true }), /rechazada/);
    const remove = setup([{ id: 99, id_profesor: 10, id_curso: 20 }], call => call.method === 'DELETE');
    await assert.rejects(remove.service.setCursoAsignado(10, 20, false, { canAdd: true, canDelete: true }), /rechazada/);
});

test('el contador excluye referencias inválidas y cursos duplicados', () => {
    const { service } = setup();
    const ids = service.cursosAsignados(10, [
        { id: 1, id_profesor: 10, id_curso: 20 },
        { id: 2, id_profesor: 10, id_curso: 20 },
        { id: 3, id_profesor: 10, id_curso: 999 },
        { id: 4, id_profesor: 11, id_curso: 21 },
        { id: 5, id_profesor: 10, id_curso: null },
    ], new Set([20, 21]));
    assert.deepEqual(Array.from(ids), [20]);
});
