import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildCatalog } from "./catalog.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const defaultApiRoot = path.resolve(projectRoot, "../api");
const artifactDirectory = path.join(projectRoot, ".test-events");
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const BATCH_PATTERN = /^BN_TEST15_\d{8}_[A-F0-9]{8}$/;
const COVER_KEY_PATTERN = /^events\/[0-9a-f-]{36}\/cover-[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/i;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseArguments(argv) {
  const command = argv[0] || "dry-run";
  const options = new Map();

  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) throw new Error(`Argumento inesperado: ${value}`);
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) options.set(key, true);
    else {
      options.set(key, next);
      index += 1;
    }
  }

  return { command, options };
}

function option(options, name, fallback) {
  const value = options.get(name);
  return typeof value === "string" ? value : fallback;
}

function createBatchId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BN_TEST15_${date}_${randomBytes(4).toString("hex").toUpperCase()}`;
}

function parseEnv(contents) {
  const result = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadApiEnvironment(apiRoot) {
  const envPath = path.join(apiRoot, ".env");
  const values = parseEnv(await readFile(envPath, "utf8"));
  return { envPath, values };
}

function applyEnvironment(values) {
  for (const [key, value] of Object.entries(values)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

function validateCatalog(catalog, batchId, now = Date.now()) {
  const errors = [];
  const titles = new Set();

  if (!BATCH_PATTERN.test(batchId)) errors.push("El batchId no respeta el formato seguro esperado.");
  if (catalog.length !== 15) errors.push(`Se esperaban 15 eventos y se generaron ${catalog.length}.`);

  for (const event of catalog) {
    const payload = event.payload;
    const label = `${event.code} (${payload.title})`;
    if (titles.has(payload.title)) errors.push(`${label}: título duplicado.`);
    titles.add(payload.title);
    if (!payload.longDescription.includes(`[BLACKNIGHT_TEST_BATCH:${batchId}]`)) errors.push(`${label}: falta el tag del lote.`);
    if (!Number.isFinite(Date.parse(payload.startAt)) || Date.parse(payload.startAt) <= now) errors.push(`${label}: la fecha no es futura.`);
    if (!Number.isInteger(payload.capacity) || payload.capacity <= 0) errors.push(`${label}: capacidad inválida.`);
    if (payload.ticketTypes.length < 2 || payload.ticketTypes.length > 4) errors.push(`${label}: debe tener entre 2 y 4 tipos de entrada.`);
    const stock = payload.ticketTypes.reduce((sum, ticket) => sum + ticket.stock, 0);
    if (stock !== payload.capacity) errors.push(`${label}: stock ${stock} distinto de capacidad ${payload.capacity}.`);
    if (payload.ticketTypes.some((ticket) => ticket.active !== true)) errors.push(`${label}: todos los tipos deben estar activos.`);
    if (payload.ticketTypes.some((ticket) => !Number.isInteger(ticket.price) || ticket.price <= 0)) errors.push(`${label}: hay precios inválidos.`);
    if (payload.ticketTypes.some((ticket) => !Number.isInteger(ticket.stock) || ticket.stock <= 0)) errors.push(`${label}: hay stock inválido.`);
    if (!Number.isFinite(payload.serviceFeePercent) || payload.serviceFeePercent < 0 || payload.serviceFeePercent > 100) errors.push(`${label}: service fee inválido.`);
    try {
      const source = new URL(event.coverReference);
      if (source.protocol !== "https:" || !["images.unsplash.com", "leb-ent.com"].includes(source.hostname)) errors.push(`${label}: fuente de portada no permitida.`);
    } catch {
      errors.push(`${label}: URL de portada inválida.`);
    }
  }

  return errors;
}

async function verifyMercadoPagoTestAccount(accessToken) {
  if (!accessToken) return { ok: false, detail: "MERCADOPAGO_ACCESS_TOKEN no está configurado." };

  try {
    const response = await fetch("https://api.mercadolibre.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, detail: `Mercado Pago respondió HTTP ${response.status}.` };
    const tags = Array.isArray(data.tags) ? data.tags.map((tag) => String(tag).toLowerCase()) : [];
    const testEvidence = data.test_user === true || tags.includes("test_user");
    return {
      ok: testEvidence,
      detail: testEvidence
        ? `Cuenta TEST confirmada por /users/me (site ${data.site_id || "desconocido"}).`
        : "La cuenta autenticada no informa test_user; no se puede descartar un cobro real.",
    };
  } catch (error) {
    return { ok: false, detail: `No se pudo verificar /users/me: ${error instanceof Error ? error.message : "error desconocido"}.` };
  }
}

async function inspectCover(reference) {
  try {
    const response = await fetch(reference, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
    const size = Number(response.headers.get("content-length") || 0);
    const validSize = size === 0 || (Number.isSafeInteger(size) && size <= MAX_COVER_BYTES);
    return {
      ok: response.ok && ALLOWED_IMAGE_TYPES.has(contentType) && validSize,
      status: response.status,
      contentType,
      sizeBytes: size || null,
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "error desconocido" };
  }
}

function r2Configuration(values) {
  const required = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "R2_BUCKET", "R2_PUBLIC_URL"];
  const missing = required.filter((key) => !values[key]);
  return { ok: missing.length === 0, missing };
}

function checkoutCallbackConfiguration(values) {
  const inspect = (name) => {
    const value = values[name];
    if (!value) return { name, ok: false, detail: "no configurada" };
    try {
      const url = new URL(value);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      return {
        name,
        ok: url.protocol === "https:" && !local,
        detail: `${url.protocol.replace(":", "")} / ${local ? "host local" : "host remoto"}`,
      };
    } catch {
      return { name, ok: false, detail: "URL inválida" };
    }
  };
  const front = inspect("FRONT_URL");
  const backend = inspect("BASE_URL");
  return {
    ok: front.ok && backend.ok,
    front,
    backend,
    detail: front.ok && backend.ok
      ? "Callbacks públicas HTTPS disponibles para retorno y webhook."
      : "El webhook que genera tickets/QR requiere BASE_URL pública HTTPS; el polling por sí solo no genera tickets.",
  };
}

async function saveJson(filename, value) {
  await mkdir(artifactDirectory, { recursive: true });
  await writeFile(path.join(artifactDirectory, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function runDryRun(options) {
  const batchId = option(options, "batch-id", createBatchId());
  const apiRoot = path.resolve(option(options, "api-root", defaultApiRoot));
  const { envPath, values } = await loadApiEnvironment(apiRoot);
  const catalog = buildCatalog(batchId);
  const catalogErrors = validateCatalog(catalog, batchId);
  const mp = options.has("mp-test-confirmed")
    ? { ok: true, detail: "Token TEST confirmado por el operador." }
    : await verifyMercadoPagoTestAccount(values.MERCADOPAGO_ACCESS_TOKEN);
  const r2 = r2Configuration(values);
  const deployedValues = {
    ...values,
    BASE_URL: option(options, "deployed-base-url", values.BASE_URL),
    FRONT_URL: option(options, "deployed-front-url", values.FRONT_URL),
  };
  const checkoutCallbacks = checkoutCallbackConfiguration(deployedValues);
  const coverResults = await Promise.all(catalog.map((event) => inspectCover(event.coverReference)));
  const invalidCovers = coverResults.flatMap((result, index) => result.ok ? [] : [{ code: catalog[index].code, ...result }]);
  const report = {
    mode: "dry-run",
    writesPerformed: false,
    generatedAt: new Date().toISOString(),
    batchId,
    apiEnvFile: envPath,
    requestedStatus: "published",
    eventCount: catalog.length,
    ticketTypeCount: catalog.reduce((sum, event) => sum + event.payload.ticketTypes.length, 0),
    totalCapacity: catalog.reduce((sum, event) => sum + event.payload.capacity, 0),
    catalog: { ok: catalogErrors.length === 0, errors: catalogErrors },
    mercadoPago: mp,
    r2,
    checkoutCallbacks,
    covers: { ok: invalidCovers.length === 0, checked: coverResults.length, invalid: invalidCovers },
    safeToLoad: catalogErrors.length === 0 && mp.ok && r2.ok && checkoutCallbacks.ok && invalidCovers.length === 0,
  };
  await saveJson(`dry-run-${batchId}.json`, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.safeToLoad) process.exitCode = 1;
}

function normalizeApiBase(value) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("La API debe usar http o https.");
  return url.toString().replace(/\/$/, "");
}

async function apiRequest(url, { method = "GET", cookie, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${url} falló con HTTP ${response.status}: ${data.error || data.message || "sin detalle"}`);
  return { response, data };
}

async function adminCookie(apiBase) {
  if (process.env.BN_ADMIN_COOKIE) return process.env.BN_ADMIN_COOKIE;
  if (!process.env.BN_ADMIN_EMAIL || !process.env.BN_ADMIN_PASSWORD) {
    throw new Error("Definí BN_ADMIN_COOKIE o BN_ADMIN_EMAIL y BN_ADMIN_PASSWORD fuera del repositorio.");
  }
  const { response, data } = await apiRequest(`${apiBase}/login`, {
    method: "POST",
    body: { email: process.env.BN_ADMIN_EMAIL, password: process.env.BN_ADMIN_PASSWORD },
  });
  if (data.user?.role !== "ADMIN") throw new Error("La sesión obtenida no corresponde a un ADMIN.");
  const setCookie = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()[0]
    : response.headers.get("set-cookie");
  if (!setCookie) throw new Error("El login no devolvió la cookie de autenticación.");
  return setCookie.split(";", 1)[0];
}

async function downloadCover(reference) {
  const response = await fetch(reference, { redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`No se pudo descargar la portada: HTTP ${response.status}.`);
  const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error(`Content-Type de portada no permitido: ${contentType || "vacío"}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_COVER_BYTES) throw new Error(`Tamaño de portada inválido: ${bytes.length} bytes.`);
  return { bytes, contentType, sha256: createHash("sha256").update(bytes).digest("hex") };
}

async function uploadCover(apiBase, cookie, cover) {
  const { data: signed } = await apiRequest(`${apiBase}/admin/events/cover-upload-url`, {
    method: "POST",
    cookie,
    body: { contentType: cover.contentType, sizeBytes: cover.bytes.length },
  });
  if (!signed.uploadUrl || !signed.objectKey || !COVER_KEY_PATTERN.test(signed.objectKey)) throw new Error("La API devolvió una respuesta de R2 inválida.");
  const response = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: signed.requiredHeaders || { "Content-Type": cover.contentType },
    body: cover.bytes,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`La carga R2 falló con HTTP ${response.status}.`);
  return signed;
}

async function runLoad(options) {
  const batchId = option(options, "batch-id");
  const confirmation = option(options, "confirm");
  if (!batchId || !BATCH_PATTERN.test(batchId)) throw new Error("Indicá un --batch-id válido generado por dry-run.");
  if (!options.has("apply") || confirmation !== batchId) throw new Error("La carga requiere --apply y --confirm <batchId>.");
  const apiRoot = path.resolve(option(options, "api-root", defaultApiRoot));
  const { values } = await loadApiEnvironment(apiRoot);
  applyEnvironment(values);
  const mp = options.has("mp-test-confirmed")
    ? { ok: true, detail: "Token TEST confirmado por el operador." }
    : await verifyMercadoPagoTestAccount(values.MERCADOPAGO_ACCESS_TOKEN);
  if (!mp.ok) throw new Error(`Carga bloqueada: ${mp.detail}`);
  const r2 = r2Configuration(values);
  if (!r2.ok) throw new Error(`Carga bloqueada: falta configuración R2 (${r2.missing.join(", ")}).`);
  const deployedValues = {
    ...values,
    BASE_URL: option(options, "deployed-base-url", values.BASE_URL),
    FRONT_URL: option(options, "deployed-front-url", values.FRONT_URL),
  };
  const checkoutCallbacks = checkoutCallbackConfiguration(deployedValues);
  if (!checkoutCallbacks.ok) throw new Error(`Carga bloqueada: ${checkoutCallbacks.detail}`);
  const catalog = buildCatalog(batchId);
  const errors = validateCatalog(catalog, batchId);
  if (errors.length) throw new Error(`Catálogo inválido:\n${errors.join("\n")}`);
  const apiBase = normalizeApiBase(option(options, "api-base", process.env.BN_TEST_API_BASE_URL || "http://localhost:3001/api"));
  const apiHost = new URL(apiBase).hostname;
  if (apiHost !== "localhost" && apiHost !== "127.0.0.1" && !options.has("allow-remote")) {
    throw new Error("La carga remota requiere --allow-remote.");
  }
  const cookie = await adminCookie(apiBase);
  const manifest = {
    batchId,
    batchTag: `[BLACKNIGHT_TEST_BATCH:${batchId}]`,
    apiBase,
    createdAt: new Date().toISOString(),
    mpTestEvidence: mp.detail,
    events: [],
    covers: [],
    state: "creating-drafts",
  };
  await saveJson(`manifest-${batchId}.json`, manifest);

  try {
    for (const definition of catalog) {
      const cover = await downloadCover(definition.coverReference);
      const signed = await uploadCover(apiBase, cookie, cover);
      manifest.covers.push({ code: definition.code, objectKey: signed.objectKey, publicUrl: signed.publicUrl, sha256: cover.sha256, sizeBytes: cover.bytes.length });
      await saveJson(`manifest-${batchId}.json`, manifest);
      const { data: created } = await apiRequest(`${apiBase}/events`, {
        method: "POST",
        cookie,
        body: { ...definition.payload, imageObjectKey: signed.objectKey },
      });
      manifest.events.push({ code: definition.code, id: created.id, title: created.title, ticketTypeIds: (created.ticketTypes || []).map((ticket) => ticket.id), status: created.status });
      await saveJson(`manifest-${batchId}.json`, manifest);
    }

    manifest.state = "publishing";
    await saveJson(`manifest-${batchId}.json`, manifest);
    for (const event of manifest.events) {
      const { data: updated } = await apiRequest(`${apiBase}/events/${event.id}`, { method: "PUT", cookie, body: { status: "published" } });
      event.status = updated.status;
      await saveJson(`manifest-${batchId}.json`, manifest);
    }
    manifest.state = "published";
    manifest.publishedAt = new Date().toISOString();
    await saveJson(`manifest-${batchId}.json`, manifest);
    console.log(JSON.stringify({ ok: true, batchId, events: manifest.events.length, manifest: path.join(artifactDirectory, `manifest-${batchId}.json`) }, null, 2));
  } catch (error) {
    manifest.state = "incomplete";
    manifest.error = error instanceof Error ? error.message : "error desconocido";
    await saveJson(`manifest-${batchId}.json`, manifest);
    throw new Error(`${manifest.error} Los recursos creados quedaron identificados; ejecutá cleanup para retirarlos.`);
  }
}

async function runCleanup(options) {
  const batchId = option(options, "batch-id");
  if (!batchId || !BATCH_PATTERN.test(batchId)) throw new Error("Indicá el --batch-id exacto.");
  const manifestPath = path.join(artifactDirectory, `manifest-${batchId}.json`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.batchId !== batchId) throw new Error("El manifiesto no coincide con el lote solicitado.");
  const apiRoot = path.resolve(option(options, "api-root", defaultApiRoot));
  const { values } = await loadApiEnvironment(apiRoot);
  applyEnvironment(values);
  const requireFromApi = createRequire(pathToFileURL(path.join(apiRoot, "package.json")));
  const { PrismaClient } = requireFromApi("@prisma/client");
  const { DeleteObjectsCommand, S3Client } = requireFromApi("@aws-sdk/client-s3");
  const prisma = new PrismaClient();
  const batchTag = `[BLACKNIGHT_TEST_BATCH:${batchId}]`;

  try {
    const events = await prisma.event.findMany({ where: { longDescription: { contains: batchTag } }, include: { ticketTypes: true } });
    const eventIds = events.map((event) => event.id);
    const expectedIds = new Set((manifest.events || []).map((event) => event.id));
    const unknownIds = eventIds.filter((id) => !expectedIds.has(id));
    if (unknownIds.length) throw new Error(`Hay eventos con el tag que no figuran en el manifiesto: ${unknownIds.join(", ")}.`);
    const ticketTypeIds = events.flatMap((event) => event.ticketTypes.map((ticket) => ticket.id));
    const reservations = eventIds.length ? await prisma.reservation.findMany({ where: { eventId: { in: eventIds } }, select: { id: true } }) : [];
    const registrations = eventIds.length ? await prisma.registration.findMany({ where: { eventId: { in: eventIds } }, select: { id: true, paymentId: true } }) : [];
    const payments = eventIds.length ? await prisma.payment.findMany({ where: { eventId: { in: eventIds } }, select: { id: true } }) : [];
    const preview = {
      batchId,
      events: eventIds.length,
      ticketTypes: ticketTypeIds.length,
      reservations: reservations.length,
      registrations: registrations.length,
      payments: payments.length,
      r2Objects: (manifest.covers || []).length,
      writesPerformed: false,
    };
    if (!options.has("apply")) {
      console.log(JSON.stringify({ mode: "cleanup-dry-run", ...preview }, null, 2));
      return;
    }
    if (option(options, "confirm") !== batchId) throw new Error("La limpieza requiere --confirm <batchId>.");
    const reservationIds = reservations.map((item) => item.id);
    const registrationIds = registrations.map((item) => item.id);
    const paymentIds = [...new Set([...payments.map((item) => item.id), ...registrations.map((item) => item.paymentId)])];
    const objectKeys = (manifest.covers || []).map((cover) => cover.objectKey);
    if (objectKeys.some((key) => !COVER_KEY_PATTERN.test(key))) throw new Error("El manifiesto contiene una clave R2 fuera del prefijo seguro de portadas.");
    const r2 = r2Configuration(values);
    if (!r2.ok) throw new Error(`Falta configuración para limpiar R2: ${r2.missing.join(", ")}.`);
    const result = await prisma.$transaction(async (tx) => {
      const tickets = registrationIds.length || ticketTypeIds.length
        ? await tx.ticket.deleteMany({ where: { OR: [
            ...(registrationIds.length ? [{ registrationId: { in: registrationIds } }] : []),
            ...(ticketTypeIds.length ? [{ ticketTypeId: { in: ticketTypeIds } }] : []),
          ] } })
        : { count: 0 };
      const registrationResult = registrationIds.length ? await tx.registration.deleteMany({ where: { id: { in: registrationIds } } }) : { count: 0 };
      const paymentResult = paymentIds.length ? await tx.payment.deleteMany({ where: { id: { in: paymentIds } } }) : { count: 0 };
      const reservationItems = reservationIds.length || ticketTypeIds.length
        ? await tx.reservationItem.deleteMany({ where: { OR: [
            ...(reservationIds.length ? [{ reservationId: { in: reservationIds } }] : []),
            ...(ticketTypeIds.length ? [{ ticketTypeId: { in: ticketTypeIds } }] : []),
          ] } })
        : { count: 0 };
      const reservationResult = reservationIds.length ? await tx.reservation.deleteMany({ where: { id: { in: reservationIds } } }) : { count: 0 };
      const ticketTypes = ticketTypeIds.length ? await tx.ticketType.deleteMany({ where: { id: { in: ticketTypeIds } } }) : { count: 0 };
      const eventResult = eventIds.length ? await tx.event.deleteMany({ where: { id: { in: eventIds }, longDescription: { contains: batchTag } } }) : { count: 0 };
      return { tickets: tickets.count, registrations: registrationResult.count, payments: paymentResult.count, reservationItems: reservationItems.count, reservations: reservationResult.count, ticketTypes: ticketTypes.count, events: eventResult.count };
    });
    if (objectKeys.length) {
      const s3 = new S3Client({
        region: "auto",
        endpoint: values.R2_ENDPOINT,
        credentials: { accessKeyId: values.R2_ACCESS_KEY_ID, secretAccessKey: values.R2_SECRET_ACCESS_KEY },
      });
      const deletion = await s3.send(new DeleteObjectsCommand({ Bucket: values.R2_BUCKET, Delete: { Objects: objectKeys.map((Key) => ({ Key })), Quiet: false } }));
      if (deletion.Errors?.length) {
        throw new Error(`R2 no pudo borrar ${deletion.Errors.length} portada(s); el manifiesto queda disponible para reintentar.`);
      }
    }
    manifest.state = "deleted";
    manifest.deletedAt = new Date().toISOString();
    manifest.cleanup = result;
    await saveJson(`manifest-${batchId}.json`, manifest);
    console.log(JSON.stringify({ ok: true, batchId, database: result, r2Objects: objectKeys.length }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

function printHelp() {
  console.log(`Uso:
  node scripts/test-events/batch.mjs dry-run [--batch-id ID] [--api-root PATH]
  node scripts/test-events/batch.mjs load --batch-id ID --apply --confirm ID [--api-base URL]
  node scripts/test-events/batch.mjs cleanup --batch-id ID
  node scripts/test-events/batch.mjs cleanup --batch-id ID --apply --confirm ID`);
}

try {
  const { command, options } = parseArguments(process.argv.slice(2));
  if (command === "dry-run") await runDryRun(options);
  else if (command === "load") await runLoad(options);
  else if (command === "cleanup") await runCleanup(options);
  else if (command === "help" || command === "--help") printHelp();
  else throw new Error(`Comando desconocido: ${command}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
