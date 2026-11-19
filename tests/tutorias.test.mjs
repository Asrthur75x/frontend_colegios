import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Run the typed service against an isolated API without writing to a real colegio.
const source = readFileSync(fileURLToPath(new URL('../src/services/tutorias.ts', import.meta.url)), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(rows = [], failure = null) {
    const calls = [];
    const apiClient = Object.fromEntries(['GET', 'POST', 'PUT', 'DELETE'].map(method => [method, async (path, options) => {
        calls.push({ method, path, options });
        if (method === failure) throw new Error('Solicitud rechazada');
        return { code: 200, data: method === 'GET' ? rows : null };
    }]));
    const executeRequest = async operation => (await operation()).data;
    const client = { apiClient, executeRequest, executeRead: (_path, operation) => executeRequest(operation) };
    const exports = {};
    vm.runInNewContext(compiled, { exports, require: () => client });
    return { service: exports, calls };
}

test('crear tutoría acepta la confirmación sin registro y envía las relaciones correctas', async () => {
    const { service, calls } = setup();
    await service.assignTutor(10, 20, { canAdd: true, canEdit: false });
    assert.deepEqual(calls.map(c => c.method), ['GET', 'POST']);
    assert.equal(calls[1].path, '/api/v1/tutoria');
    assert.equal(JSON.stringify(calls[1].options.body), JSON.stringify({ id_seccion: 10, id_profesor: 20 }));
});

test('cambiar tutor usa PUT sobre el ID de la asignación, sin eliminarla', async () => {
    const { service, calls } = setup([{ id: 99, id_seccion: 10, id_profesor: 20 }]);
    await service.assignTutor(10, 21, { canAdd: false, canEdit: true });
    assert.deepEqual(calls.map(c => c.method), ['GET', 'PUT']);
    assert.equal(calls[1].options.params.path.pk, 99);
    assert.equal(calls[1].options.body.id_profesor, 21);
});

test('un cambio fallido conserva la asignación anterior', async () => {
    const rows = [{ id: 99, id_seccion: 10, id_profesor: 20 }];
    const { service, calls } = setup(rows, 'PUT');
    await assert.rejects(service.assignTutor(10, 21, { canAdd: true, canEdit: true }), /rechazada/);
    assert.equal(rows[0].id_profesor, 20);
    assert.deepEqual(calls.map(c => c.method), ['GET', 'PUT']);
});

test('la misma asignación no escribe ni elimina registros', async () => {
    const { service, calls } = setup([{ id: 99, id_seccion: 10, id_profesor: 20 }]);
    await service.assignTutor(10, 20, { canAdd: true, canEdit: true });
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('duplicados existentes impiden una nueva asignación', async () => {
    const { service, calls } = setup([
        { id: 1, id_seccion: 10, id_profesor: 20 },
        { id: 2, id_seccion: 10, id_profesor: 21 },
    ]);
    await assert.rejects(service.assignTutor(10, 22, { canAdd: true, canEdit: true }), /varias asignaciones/);
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('los permisos se comprueban según el estado actual del servidor', async () => {
    const existing = setup([{ id: 99, id_seccion: 10, id_profesor: 20 }]);
    await assert.rejects(existing.service.assignTutor(10, 21, { canAdd: true, canEdit: false }), /permiso/);
    const empty = setup();
    await assert.rejects(empty.service.assignTutor(10, 21, { canAdd: false, canEdit: true }), /permiso/);
    assert.equal(existing.calls.length, 1);
    assert.equal(empty.calls.length, 1);
});

test('un fallo de lectura no genera una escritura basada en datos vacíos', async () => {
    const { service, calls } = setup([], 'GET');
    await assert.rejects(service.assignTutor(10, 20, { canAdd: true, canEdit: true }), /rechazada/);
    assert.deepEqual(calls.map(c => c.method), ['GET']);
});

test('quitar tutor utiliza el ID del registro', async () => {
    const { service, calls } = setup();
    await service.deleteTutoria(99);
    assert.equal(calls[0].method, 'DELETE');
    assert.equal(calls[0].path, '/api/v1/tutoria/{pk}');
    assert.equal(calls[0].options.params.path.pk, 99);
});

test('el resumen cuenta secciones válidas y detecta duplicados y referencias inválidas', () => {
    const { service } = setup();
    const summary = service.summarizeTutorias(
        [{ id: 10 }, { id: 11 }, { id: 12 }],
        [{ id: 20 }, { id: 21 }],
        [
            { id: 1, id_seccion: 10, id_profesor: 20 },
            { id: 2, id_seccion: 11, id_profesor: 20 },
            { id: 3, id_seccion: 11, id_profesor: 21 },
            { id: 4, id_seccion: 12, id_profesor: 999 },
            { id: 5, id_seccion: 999, id_profesor: 20 },
        ],
    );
    assert.equal(summary.completas, 1);
    assert.equal(summary.pendientes, 2);
    assert.equal(summary.duplicadas, 1);
    assert.equal(summary.invalidas, 2);
});
