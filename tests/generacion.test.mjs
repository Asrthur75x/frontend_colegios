import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const compile = relative => ts.transpileModule(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const globalCode = compile('../src/components/Horarios/generacionGlobal.js');
const serviceCode = compile('../src/services/horarios.ts');
const serviceExports = {};
vm.runInNewContext(serviceCode, { exports: serviceExports, require: () => ({}) });
const asignaciones = [{ seccion_id: 'SEC_10', curso_id: 'TUT1', profesor_id: 'PROF_20', dia: 'Lunes', turno: 'Mañana', slot_inicio: 0, horas: 1 }];
const done = () => ({ status: 'done', resultado: { estado: 'OPTIMAL', asignaciones } });
const flush = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };

function setup({ progress = async () => done(), start = async () => ({ task_id: 'task-1', status: 'dispatched' }), storage = new Map(), allowed = true } = {}) {
    let session = { user: { id: 1, schema_name: 'tenant_demo' } };
    const delays = [];
    const events = [];
    const calls = { starts: 0, polls: [] };
    const window = { sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
        addEventListener() {}, dispatchEvent: event => events.push(event) };
    const exports = {};
    const sessionApi = { getSession: () => session, hasPermission: () => allowed, SESSION_EVENT: 'session' };
    const api = { generationAssignments: serviceExports.generationAssignments,
        startHorario: async () => { calls.starts++; return start(); },
        getHorarioProgress: async taskId => { calls.polls.push(taskId); return progress(); } };
    vm.runInNewContext(globalCode, { exports, window, console, Date, Error, Event, CustomEvent,
        setTimeout: (callback, ms) => { delays.push(ms); queueMicrotask(callback); },
        require: path => path.includes('session') ? sessionApi : api });
    return { gen: exports, storage, calls, events, delays, switchSession: value => { session = value; } };
}

test('una tarea aceptada con 202/already_completed se consulta sin lanzar otra generación', async () => {
    const { gen, calls } = setup({ start: async () => ({ task_id: 'existing', status: 'already_completed' }) });
    await gen.startGeneracion();
    assert.equal(calls.starts, 1);
    assert.deepEqual(calls.polls, ['existing']);
    assert.equal(gen.getGeneracionState().status, 'success');
});

test('las consultas de progreso se espacian al menos tres segundos', async () => {
    let n = 0;
    const { gen, delays } = setup({ progress: async () => ++n < 3 ? { status: 'running', step: 'solving', percent: 65 } : done() });
    await gen.startGeneracion();
    assert.deepEqual(delays, [3000, 3000]);
    assert.equal(gen.getGeneracionState().progressPercent, 100);
});

test('un 429 respeta Retry-After y continúa siguiendo la misma tarea', async () => {
    let n = 0;
    const { gen, calls, delays } = setup({ progress: async () => {
        if (!n++) throw Object.assign(new Error('Límite temporal'), { status: 429, retryAfter: 12 });
        return done();
    } });
    await gen.startGeneracion();
    assert.deepEqual(delays, [12000]);
    assert.equal(calls.starts, 1);
    assert.deepEqual(calls.polls, ['task-1', 'task-1']);
    assert.equal(gen.getGeneracionState().status, 'success');
});

test('recargar la página recupera task_id y reanuda solo el seguimiento', async () => {
    const storage = new Map();
    storage.set('horarix.generation.v2:' + JSON.stringify(['tenant_demo', 1]), JSON.stringify({ status: 'generating', taskId: 'saved-task', startedAt: Date.now() }));
    const { gen, calls } = setup({ storage });
    const unsubscribe = gen.subscribe(() => {});
    await flush();
    unsubscribe();
    assert.equal(calls.starts, 0);
    assert.deepEqual(calls.polls, ['saved-task']);
    assert.equal(gen.getGeneracionState().status, 'success');
});

test('dos clics mientras se despacha la tarea producen un solo POST', async () => {
    let resolve;
    const pending = new Promise(r => { resolve = r; });
    const { gen, calls } = setup({ start: () => pending });
    const first = gen.startGeneracion();
    await gen.startGeneracion();
    resolve({ task_id: 'task-1' });
    await first;
    assert.equal(calls.starts, 1);
});

test('cambiar de usuario durante una petición descarta la respuesta anterior', async () => {
    let resolve;
    const { gen, switchSession } = setup({ progress: () => new Promise(r => { resolve = r; }) });
    const running = gen.startGeneracion();
    await flush();
    switchSession({ user: { id: 2, schema_name: 'tenant_otro' } });
    assert.equal(gen.getGeneracionState().status, null);
    resolve(done());
    await running;
    assert.equal(gen.getGeneracionState().status, null);
    assert.equal(gen.getGeneracionState().asignaciones, null);
});

test('un fallo de red persistente permite reanudar sin volver a generar', async () => {
    let fails = true;
    const { gen, calls } = setup({ progress: async () => {
        if (fails) throw Object.assign(new Error('Sin conexión'), { status: 503 });
        return done();
    } });
    await gen.startGeneracion();
    assert.equal(gen.getGeneracionState().canResume, true);
    fails = false;
    await gen.startGeneracion();
    assert.equal(calls.starts, 1);
    assert.equal(gen.getGeneracionState().status, 'success');
});

test('una tarea terminada sin solución no se anuncia como éxito', async () => {
    const { gen, events } = setup({ progress: async () => ({ status: 'done', resultado: { estado: 'INFEASIBLE', mensaje: 'No hay solución', asignaciones: [] } }) });
    await gen.startGeneracion();
    assert.equal(gen.getGeneracionState().status, 'error');
    assert.match(gen.getGeneracionState().errorMsg, /No hay solución/);
    assert.ok(!events.some(e => e.detail?.success));
});

test('una tarea expirada o con error conserva el mensaje del servidor', async () => {
    for (const progress of [{ status: 'not_found' }, { status: 'error', message: 'Falló el motor' }]) {
        const { gen } = setup({ progress: async () => progress });
        await gen.startGeneracion();
        assert.equal(gen.getGeneracionState().status, 'error');
        assert.equal(gen.getGeneracionState().canResume, false);
    }
});

test('sin permisos no se inicia una tarea', async () => {
    const { gen, calls } = setup({ allowed: false });
    await gen.startGeneracion();
    assert.equal(calls.starts, 0);
    assert.equal(gen.getGeneracionState().status, 'error');
});

test('la tabla recibe los IDs, recreos y slots de la API nueva sin alterar la respuesta', () => {
    const input = { secciones: [{ id: 10 }], cursos: [{ id: 11 }], profesores: [{ id: 12 }],
        dias: [{ id: 13, orden: 1 }], bloques: [{ id: 14, is_recess: true }], grados: [{ id: 15 }],
        sedes: [{ id: 16 }], turnos: [{ id: 17 }], reservas: [{ id: 18, opciones: [{ id: 19, slots: [{ nro_bloque: 2 }] }] }] };
    const before = JSON.stringify(input);
    const result = serviceExports.adaptHorarioData(input);
    assert.equal(result.secciones[0].id_seccion, 10);
    assert.equal(result.bloques[0].es_recreo, true);
    assert.equal(result.reservas[0].opciones[0].slots[0], 2);
    assert.equal(JSON.stringify(input), before);
});

test('el resultado vacío o sin estado válido no se convierte en un horario', () => {
    for (const result of [null, {}, { estado: 'UNKNOWN' }, { estado: 'FEASIBLE', asignaciones: [] }]) {
        assert.throws(() => serviceExports.generationAssignments(result));
    }
});
