import React, { useEffect, useMemo, useState } from "react";

import {
  fetchRemoteAppState,
  remoteEnabled,
  saveRemoteAppState,
} from "./lib/cloudStore.js";

const DEFAULT_PRICE_PER_KG = 1650;
const FIXED = "Cliente fijo";
const OCCASIONAL = "Cliente ocasional";
const METHODS = ["Efectivo", "Transferencia"];
const STATUSES = ["Pendiente", "Pagado"];
const CUSTOMERS_KEY = "casa-bravo-customers";
const ORDERS_KEY = "casa-bravo-orders";
const SESSION_KEY = "casa-bravo-session";
const AUDIT_KEY = "casa-bravo-audit-log";
const SETTINGS_KEY = "casa-bravo-settings";
const USERS = [
  { username: "Krlos Bravo", password: "Krlos2026" },
  { username: "Osvaldo Bravo", password: "Osvaldo2026" },
];
const OWNER_USERNAME = "Krlos Bravo";
const BREAD_TYPES = [
  "Marraquetas",
  "Hallullas",
  "Colisas",
  "Integral",
  "Amasado",
  "Bollito",
  "Rosita",
  "Dobladitas",
  "Completo",
  "Hamburguesa",
];

const createEmptyBreadKgMap = () => ({
  Marraquetas: "",
  Hallullas: "",
  Colisas: "",
  Integral: "",
  Amasado: "",
  Bollito: "",
  Rosita: "",
  Dobladitas: "",
  Completo: "",
  Hamburguesa: "",
});

const createDeliverySchedule = () => ({
  id: `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  deliveryTime: "",
  deliveryAddress: "",
  breadMap: createEmptyBreadKgMap(),
  orderItems: "",
  breadKg: "",
});

const normalizeDeliverySchedule = (schedule = {}) => {
  const breadMap = {
    ...createEmptyBreadKgMap(),
    ...(schedule.breadMap || schedule.defaultDailyBreadMap || {}),
  };
  const breadKg = totalBreadFromVarieties(breadMap);

  return {
    id: schedule.id || `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    deliveryTime: schedule.deliveryTime || "",
    deliveryAddress: schedule.deliveryAddress || "",
    breadMap,
    orderItems: buildOrderSummary(breadMap),
    breadKg: breadKg ? String(breadKg) : "",
  };
};

const ensureCustomerSchedules = (customer = {}) => {
  if (customer.deliverySchedules?.length) {
    return customer.deliverySchedules.map(normalizeDeliverySchedule);
  }

  if (
    customer.deliveryTime ||
    customer.deliveryAddress ||
    customer.defaultDailyOrderItems ||
    totalBreadFromVarieties(customer.defaultDailyBreadMap || {}) > 0
  ) {
    return [
      normalizeDeliverySchedule({
        deliveryTime: customer.deliveryTime,
        deliveryAddress: customer.deliveryAddress,
        breadMap: customer.defaultDailyBreadMap,
      }),
    ];
  }

  return [createDeliverySchedule()];
};

const scheduleSummary = (schedule) => {
  const pieces = [];
  if (schedule.deliveryTime) pieces.push(schedule.deliveryTime);
  if (schedule.deliveryAddress) pieces.push(schedule.deliveryAddress);
  if (schedule.orderItems) pieces.push(schedule.orderItems);
  return pieces.join(" | ");
};

const customerSchedulesSummary = (schedules = []) =>
  schedules.map(scheduleSummary).filter(Boolean).join(" || ");

const totalBreadFromSchedules = (schedules = []) =>
  schedules.reduce((total, schedule) => total + Number(schedule.breadKg || 0), 0);

const normalizeCustomerRecord = (customer = {}) => {
  const deliverySchedules = ensureCustomerSchedules(customer);
  const firstSchedule = deliverySchedules[0] || createDeliverySchedule();

  return {
    ...customer,
    deliveryTime: firstSchedule.deliveryTime,
    deliveryAddress: firstSchedule.deliveryAddress,
    defaultDailyBreadMap: {
      ...createEmptyBreadKgMap(),
      ...(firstSchedule.breadMap || {}),
    },
    defaultDailyOrderItems: firstSchedule.orderItems || "",
    defaultDailyBreadKg: totalBreadFromSchedules(deliverySchedules),
    deliverySchedules,
    deliverySchedulesSummary: customerSchedulesSummary(deliverySchedules),
  };
};

const seedCustomers = [
  {
    id: 1,
    name: "Maria Perez",
    phone: "+56912345678",
    deliveryTime: "08:30",
    deliveryAddress: "Av. Providencia 1234, Santiago, Chile",
    customerType: FIXED,
    defaultDailyBreadKg: 6,
    defaultDailyOrderItems: "Marraquetas: 6 kg",
    defaultDailyBreadMap: {
      Marraquetas: "6",
      Hallullas: "",
      Colisas: "",
      Integral: "",
      Amasado: "",
      Bollito: "",
      Rosita: "",
      Dobladitas: "",
      Completo: "",
      Hamburguesa: "",
    },
    deliverySchedules: [
      {
        id: "maria-manana",
        deliveryTime: "08:30",
        deliveryAddress: "Av. Providencia 1234, Santiago, Chile",
        breadMap: {
          Marraquetas: "6",
          Hallullas: "",
          Colisas: "",
          Integral: "",
          Amasado: "",
          Bollito: "",
          Rosita: "",
          Dobladitas: "",
          Completo: "",
          Hamburguesa: "",
        },
      },
    ],
    notes: "Cliente fijo",
  },
  {
    id: 2,
    name: "Juan Soto",
    phone: "+56987654321",
    deliveryTime: "10:00",
    deliveryAddress: "Gran Avenida 4567, San Miguel, Chile",
    customerType: OCCASIONAL,
    defaultDailyBreadKg: 0,
    defaultDailyOrderItems: "",
    defaultDailyBreadMap: createEmptyBreadKgMap(),
    deliverySchedules: [
      {
        id: "juan-manana",
        deliveryTime: "10:00",
        deliveryAddress: "Gran Avenida 4567, San Miguel, Chile",
        breadMap: createEmptyBreadKgMap(),
      },
    ],
    notes: "Compra algunos fines de semana",
  },
];

const seedOrders = [
  {
    id: 1,
    customerId: 1,
    customerScheduleId: "maria-manana",
    customerName: "Maria Perez",
    customerPhone: "+56912345678",
    deliveryTime: "08:30",
    deliveryAddress: "Av. Providencia 1234, Santiago, Chile",
    customerType: FIXED,
    defaultDailyBreadKg: 6,
    useDefaultDailyKg: true,
    deliveryDate: "2026-04-05",
    orderItems: "Marraquetas: 6 kg",
    orderBreadKg: {
      Marraquetas: "6",
      Hallullas: "",
      Colisas: "",
      Integral: "",
      Amasado: "",
      Bollito: "",
      Rosita: "",
      Dobladitas: "",
      Completo: "",
      Hamburguesa: "",
    },
    breadKg: 6,
    discount: 1000,
    extraCharge: 0,
    amountPaid: 5000,
    paymentMethod: "Transferencia",
    paymentStatus: "Pendiente",
    paymentComment: "",
    modifications: "Se mantiene la cantidad diaria registrada",
    notes: "Entregar temprano",
    customerDeleted: false,
  },
  {
    id: 2,
    customerId: 2,
    customerScheduleId: "juan-manana",
    customerName: "Juan Soto",
    customerPhone: "+56987654321",
    deliveryTime: "10:00",
    deliveryAddress: "Gran Avenida 4567, San Miguel, Chile",
    customerType: OCCASIONAL,
    defaultDailyBreadKg: 0,
    useDefaultDailyKg: false,
    deliveryDate: "2026-04-06",
    orderItems: "Marraquetas: 2 kg, Hallullas: 2 kg",
    orderBreadKg: {
      Marraquetas: "2",
      Hallullas: "2",
      Colisas: "",
      Integral: "",
      Amasado: "",
      Bollito: "",
      Rosita: "",
      Dobladitas: "",
      Completo: "",
      Hamburguesa: "",
    },
    breadKg: 4,
    discount: 0,
    extraCharge: 500,
    amountPaid: 0,
    paymentMethod: "Efectivo",
    paymentStatus: "Pendiente",
    paymentComment: "",
    modifications: "Agregar 1 kg extra de hallullas",
    notes: "Cobrar al entregar",
    customerDeleted: false,
  },
];

const emptyOrder = {
  customerId: "",
  customerScheduleId: "",
  customerName: "",
  customerPhone: "",
  deliveryTime: "",
  deliveryAddress: "",
  customerType: OCCASIONAL,
  defaultDailyBreadKg: "",
  useDefaultDailyKg: true,
  deliveryDate: "",
  orderItems: "",
  orderBreadKg: {
    ...createEmptyBreadKgMap(),
  },
  breadKg: "",
  discount: "0",
  extraCharge: "0",
  amountPaid: "0",
  paymentMethod: "Efectivo",
  paymentStatus: "Pendiente",
  paymentComment: "",
  modifications: "",
  notes: "",
};

const emptyCustomer = {
  name: "",
  phone: "",
  deliveryTime: "",
  deliveryAddress: "",
  customerType: OCCASIONAL,
  defaultDailyBreadKg: "",
  defaultDailyOrderItems: "",
  defaultDailyBreadMap: createEmptyBreadKgMap(),
  deliverySchedules: [createDeliverySchedule()],
  deliverySchedulesSummary: "",
  notes: "",
};

const currency = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatTimestamp = (value) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));

const textValue = (value) => {
  if (value === null || value === undefined || value === "") return "vacio";
  if (typeof value === "boolean") return value ? "Si" : "No";
  return String(value);
};

const collectChanges = (previous, next, labels) =>
  Object.entries(labels).reduce((changes, [field, label]) => {
    if (textValue(previous?.[field]) === textValue(next?.[field])) return changes;
    return [
      ...changes,
      `${label}: ${textValue(previous?.[field])} -> ${textValue(next?.[field])}`,
    ];
  }, []);

const customerFieldLabels = {
  name: "Nombre",
  phone: "Telefono",
  deliverySchedulesSummary: "Horarios de entrega",
  customerType: "Tipo de cliente",
  defaultDailyBreadKg: "Cantidad diaria",
  defaultDailyOrderItems: "Variedades diarias",
  notes: "Notas",
};

const orderFieldLabels = {
  customerName: "Cliente",
  customerPhone: "Telefono",
  deliveryTime: "Horario de entrega",
  deliveryAddress: "Direccion de entrega",
  customerType: "Tipo de cliente",
  deliveryDate: "Fecha de entrega",
  orderItems: "Detalle del pedido",
  defaultDailyBreadKg: "Cantidad diaria registrada",
  useDefaultDailyKg: "Usar cantidad diaria",
  breadKg: "Cantidad de pan",
  paymentMethod: "Medio de pago",
  paymentStatus: "Estado de pago",
  paymentComment: "Comentario de pago",
  discount: "Descuento",
  extraCharge: "Ajustes",
  amountPaid: "Monto pagado",
  modifications: "Modificaciones",
  notes: "Notas internas",
};

const settingsFieldLabels = {
  pricePerKg: "Precio por kilo",
};

const buildOrderSummary = (orderBreadKg = {}) =>
  BREAD_TYPES
    .map((type) => {
      const kg = Number(orderBreadKg[type] || 0);
      return kg > 0 ? `${type}: ${kg} kg` : null;
    })
    .filter(Boolean)
    .join(", ");

const totalBreadFromVarieties = (orderBreadKg = {}) =>
  BREAD_TYPES.reduce((total, type) => total + Number(orderBreadKg[type] || 0), 0);

const mapsLinkFor = (address = "") =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const currentDateISO = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const cleanPhone = (phone = "") => {
  let cleaned = String(phone).replace(/[^\d]/g, "");
  if (cleaned && !cleaned.startsWith("56")) cleaned = `56${cleaned}`;
  return cleaned;
};

const subtotalFor = (kg, pricePerKg) => Number(kg || 0) * Number(pricePerKg || 0);

const effectiveKg = (order) =>
  totalBreadFromVarieties(order.orderBreadKg) > 0
    ? totalBreadFromVarieties(order.orderBreadKg)
    : order.customerType === FIXED &&
        Number(order.defaultDailyBreadKg || 0) > 0 &&
        order.useDefaultDailyKg
      ? Number(order.defaultDailyBreadKg || 0)
      : Number(order.breadKg || 0);

const computeOrder = (order, pricePerKg) => {
  const normalizedOrderItems = buildOrderSummary(order.orderBreadKg) || order.orderItems;
  const computedBreadKg = effectiveKg(order);
  const computedSubtotal = subtotalFor(computedBreadKg, pricePerKg);
  const computedTotal =
    computedSubtotal - Number(order.discount || 0) + Number(order.extraCharge || 0);

  return {
    ...order,
    orderItems: normalizedOrderItems,
    computedBreadKg,
    computedSubtotal,
    computedTotal,
    computedPending: Math.max(computedTotal - Number(order.amountPaid || 0), 0),
  };
};

const orderMessage = (order) => {
  const o = computeOrder(order, order.pricePerKg);
  return [
    `Hola ${o.customerName}, te compartimos el detalle de tu compra de panaderia.`,
    o.customerType === FIXED && Number(o.defaultDailyBreadKg || 0) > 0
      ? `Cantidad diaria registrada: ${Number(o.defaultDailyBreadKg || 0)} kg`
      : null,
    `Pedido: ${o.orderItems}`,
    o.computedBreadKg ? `Pan solicitado: ${o.computedBreadKg} kg` : null,
    `Fecha: ${o.deliveryDate || "sin fecha"}`,
    `Estado pago: ${o.paymentStatus}`,
    `Valor por kg: ${currency(o.pricePerKg)}`,
    `Subtotal: ${currency(o.computedSubtotal)}`,
    `Descuento: ${currency(o.discount)}`,
    `Ajustes: ${currency(o.extraCharge)}`,
    `Pagado: ${currency(o.amountPaid)}`,
    `Total final: ${currency(o.computedTotal)}`,
    `Saldo pendiente: ${currency(o.computedPending)}`,
    `Medio de pago: ${o.paymentMethod}`,
    o.paymentComment ? `Comentario pago: ${o.paymentComment}` : null,
    o.modifications ? `Modificaciones: ${o.modifications}` : null,
    o.notes ? `Notas: ${o.notes}` : null,
    "",
    "Gracias por preferirnos. Casa Bravo",
  ]
    .filter(Boolean)
    .join("\n");
};

const paidMessage = (order) => {
  const o = computeOrder(order, order.pricePerKg);
  return [
    `Hola ${o.customerName}, te confirmamos que el pago de tu pedido fue registrado con exito.`,
    `Pedido: ${o.orderItems}`,
    `Fecha: ${o.deliveryDate || "sin fecha"}`,
    `Medio de pago: ${o.paymentMethod}`,
    o.paymentComment ? `Comentario pago: ${o.paymentComment}` : null,
    `Total pagado: ${currency(o.computedTotal)}`,
    "Estado pago: Pagado",
    "",
    "Muchas gracias por tu compra. Casa Bravo",
  ].join("\n");
};

const whatsappMessageFor = (order) =>
  order.paymentStatus === "Pagado" ? paidMessage(order) : orderMessage(order);

const readLocal = (key, fallback) => {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const ensureSeedOrder = (savedOrders) => {
  const hasPendingSeed = savedOrders.some((order) => order.id === 2);
  return hasPendingSeed ? savedOrders : [...savedOrders, seedOrders[1]];
};

const normalizeRemoteState = (payload) => ({
  customers: Array.isArray(payload?.customers)
    ? payload.customers.map(normalizeCustomerRecord)
    : readLocal(CUSTOMERS_KEY, seedCustomers).map(normalizeCustomerRecord),
  orders: Array.isArray(payload?.orders)
    ? ensureSeedOrder(payload.orders)
    : ensureSeedOrder(readLocal(ORDERS_KEY, seedOrders)),
  auditLog: Array.isArray(payload?.audit_log)
    ? payload.audit_log
    : readLocal(AUDIT_KEY, []),
  settings: {
    pricePerKg: Number(
      payload?.settings?.pricePerKg ??
        readLocal(SETTINGS_KEY, { pricePerKg: DEFAULT_PRICE_PER_KG }).pricePerKg ??
        DEFAULT_PRICE_PER_KG
    ),
  },
});

const appStateSnapshot = ({ customers, orders, auditLog, settings }) =>
  JSON.stringify({
    customers,
    orders,
    auditLog,
    settings,
  });

const openWhatsapp = (phone, message) => {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return window.alert("Telefono invalido.");
  window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
};

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between modal-head">
          <h2>{title}</h2>
          <button className="btn alt" onClick={onClose} type="button">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`.trim()}>{children}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function LoginScreen({ loginForm, loginError, onChange, onSubmit }) {
  return (
    <div className="page login-page">
      <div className="container login-shell">
        <section className="hero login-hero">
          <div className="hero-copy">
            <p className="eyebrow">Casa Bravo</p>
            <h1>Ingreso a gestion interna</h1>
            <p className="lead">
              Accede con tu usuario para revisar clientes, pedidos y pagos.
            </p>
          </div>
          <div className="hero-side">
            <div className="hero-surface login-surface">
              <p className="hero-kicker">Todo en un solo lugar</p>
              <div className="hero-mini-stats">
                <div>
                  <span>Clientes</span>
                  <strong>Controlados</strong>
                </div>
                <div>
                  <span>Pagos</span>
                  <strong>Ordenados</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel login-panel">
          <h2>Iniciar sesion</h2>
          <div className="form login-form">
            <label className="full">
              <span>Usuario</span>
              <input
                value={loginForm.username}
                onChange={(e) => onChange("username", e.target.value)}
                placeholder="Ingresa tu usuario"
              />
            </label>
            <label className="full">
              <span>Contrasena</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="Ingresa tu contrasena"
              />
            </label>
          </div>
          {loginError ? <p className="login-error">{loginError}</p> : null}
          <div className="row end">
            <button className="btn" onClick={onSubmit} type="button">
              Entrar
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [customers, setCustomers] = useState(() =>
    readLocal(CUSTOMERS_KEY, seedCustomers).map(normalizeCustomerRecord)
  );
  const [orders, setOrders] = useState(() =>
    ensureSeedOrder(readLocal(ORDERS_KEY, seedOrders))
  );
  const [settings, setSettings] = useState(() =>
    readLocal(SETTINGS_KEY, { pricePerKg: DEFAULT_PRICE_PER_KG })
  );
  const [auditLog, setAuditLog] = useState(() => readLocal(AUDIT_KEY, []));
  const [sessionUser, setSessionUser] = useState(() => readLocal(SESSION_KEY, null));
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [priceInput, setPriceInput] = useState(() =>
    String(readLocal(SETTINGS_KEY, { pricePerKg: DEFAULT_PRICE_PER_KG }).pricePerKg)
  );
  const [tab, setTab] = useState("customers");
  const [customerSearch, setCustomerSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [isRemoteBooting, setIsRemoteBooting] = useState(remoteEnabled);
  const [syncStatus, setSyncStatus] = useState(
    remoteEnabled ? "Conectando base de datos compartida..." : "Modo local activo"
  );
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [skipRemoteSave, setSkipRemoteSave] = useState(false);
  const [lastRemoteSnapshot, setLastRemoteSnapshot] = useState("");

  useEffect(() => window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers)), [customers]);
  useEffect(() => window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)), [orders]);
  useEffect(() => window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);
  useEffect(() => window.localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog)), [auditLog]);
  useEffect(() => window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser)), [sessionUser]);
  useEffect(() => setPriceInput(String(settings.pricePerKg)), [settings.pricePerKg]);
  useEffect(() => {
    let active = true;

    const bootRemoteState = async () => {
      if (!remoteEnabled) {
        setIsRemoteBooting(false);
        return;
      }

      setSyncStatus("Cargando datos compartidos...");
      const { data, error } = await fetchRemoteAppState();
      if (!active) return;

      if (error) {
        setSyncError("No se pudo conectar con la base de datos compartida.");
        setSyncStatus("Trabajando con respaldo local");
        setIsRemoteBooting(false);
        return;
      }

      if (data) {
        const nextState = normalizeRemoteState(data);
        setSkipRemoteSave(true);
        setCustomers(nextState.customers);
        setOrders(nextState.orders);
        setAuditLog(nextState.auditLog);
        setSettings(nextState.settings);
        setLastRemoteSnapshot(appStateSnapshot(nextState));
        setLastSyncedAt(data.updated_at || "");
        setSyncStatus("Datos compartidos sincronizados");
      } else {
        setSyncStatus("Base lista para sincronizar");
      }

      setSyncError("");
      setIsRemoteBooting(false);
    };

    bootRemoteState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!remoteEnabled || isRemoteBooting) return;
    if (skipRemoteSave) {
      setSkipRemoteSave(false);
      return;
    }

    const payload = { customers, orders, auditLog, settings };
    const nextSnapshot = appStateSnapshot(payload);
    if (nextSnapshot === lastRemoteSnapshot) return;

    const timeoutId = window.setTimeout(async () => {
      setSyncStatus("Guardando cambios en la base de datos...");
      const { data, error } = await saveRemoteAppState(payload);

      if (error) {
        setSyncError("No se pudieron guardar los cambios compartidos.");
        setSyncStatus("Error de sincronizacion");
        return;
      }

      setLastRemoteSnapshot(nextSnapshot);
      setLastSyncedAt(data?.updated_at || new Date().toISOString());
      setSyncError("");
      setSyncStatus("Cambios sincronizados");
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    auditLog,
    customers,
    isRemoteBooting,
    lastRemoteSnapshot,
    orders,
    settings,
    skipRemoteSave,
  ]);

  useEffect(() => {
    if (!remoteEnabled || isRemoteBooting) return;

    const intervalId = window.setInterval(async () => {
      const { data, error } = await fetchRemoteAppState();
      if (error || !data?.updated_at) return;

      const nextState = normalizeRemoteState(data);
      const nextSnapshot = appStateSnapshot(nextState);
      if (nextSnapshot === lastRemoteSnapshot) {
        if (data.updated_at !== lastSyncedAt) {
          setLastSyncedAt(data.updated_at);
        }
        return;
      }

      setSkipRemoteSave(true);
      setCustomers(nextState.customers);
      setOrders(nextState.orders);
      setAuditLog(nextState.auditLog);
      setSettings(nextState.settings);
      setLastRemoteSnapshot(nextSnapshot);
      setLastSyncedAt(data.updated_at);
      setSyncError("");
      setSyncStatus("Se recibieron cambios nuevos desde la nube");
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [isRemoteBooting, lastRemoteSnapshot, lastSyncedAt]);

  useEffect(() => {
    const today = currentDateISO();
    const generatedEntries = [];

    setOrders((prev) => {
      const missingOrders = customers.flatMap((customer) => {
        if (customer.customerType !== FIXED) return [];

        return (customer.deliverySchedules || [])
          .filter((schedule) => Number(schedule.breadKg || 0) > 0)
          .filter((schedule) => {
            const hasExisting = prev.some((order) =>
              String(order.customerId) === String(customer.id) &&
              order.deliveryDate === today &&
              (
                (order.customerScheduleId && order.customerScheduleId === schedule.id) ||
                (!order.customerScheduleId &&
                  order.deliveryTime === schedule.deliveryTime &&
                  order.orderItems === schedule.orderItems)
              )
            );
            return !hasExisting;
          })
          .map((schedule) => {
            const generatedOrder = {
              id: Date.now() + Math.random(),
              customerId: customer.id,
              customerScheduleId: schedule.id,
              customerName: customer.name,
              customerPhone: customer.phone,
              deliveryTime: schedule.deliveryTime,
              deliveryAddress: schedule.deliveryAddress || customer.deliveryAddress || "",
              customerType: customer.customerType,
              defaultDailyBreadKg: Number(schedule.breadKg || 0),
              useDefaultDailyKg: true,
              deliveryDate: today,
              orderItems: schedule.orderItems,
              orderBreadKg: { ...schedule.breadMap },
              breadKg: Number(schedule.breadKg || 0),
              discount: 0,
              extraCharge: 0,
              amountPaid: 0,
              paymentMethod: "Efectivo",
              paymentStatus: "Pendiente",
              paymentComment: "",
              modifications: "",
              notes: "",
              customerDeleted: false,
            };
            generatedEntries.push(`${customer.name} ${schedule.deliveryTime || "sin hora"}`);
            return generatedOrder;
          });
      });

      return missingOrders.length ? [...missingOrders, ...prev] : prev;
    });

    if (generatedEntries.length) {
      setAuditLog((prev) => [
        {
          id: Date.now() + Math.random(),
          action: "Registros diarios generados",
          detail: `Se generaron ${generatedEntries.length} registros automaticos para ${today}.`,
          changes: generatedEntries.map((entry) => `Registro creado: ${entry}`),
          username: "Sistema",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  }, [customers]);

  const computedOrders = useMemo(
    () => orders.map((order) => ({ ...computeOrder(order, settings.pricePerKg), pricePerKg: settings.pricePerKg })),
    [orders, settings.pricePerKg]
  );
  const filteredOrders = useMemo(
    () => computedOrders.filter((o) => !dateFilter || o.deliveryDate === dateFilter),
    [computedOrders, dateFilter]
  );
  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.customerType].filter(Boolean).some((v) => v.toLowerCase().includes(term))
    );
  }, [customers, customerSearch]);

  const summary = useMemo(() => ({
    totalOrders: computedOrders.length,
    totalCustomers: customers.length,
    fixedClients: customers.filter((c) => c.customerType === FIXED).length,
    pendingPayments: computedOrders.filter((o) => o.paymentStatus !== "Pagado").length,
    totalCollected: computedOrders.reduce((acc, o) => acc + Number(o.amountPaid || 0), 0),
  }), [computedOrders, customers]);

  const currentKg = effectiveKg(orderForm);
  const selectedCustomerSchedules = useMemo(() => {
    const selectedCustomer = customers.find((customer) => String(customer.id) === String(orderForm.customerId));
    return selectedCustomer?.deliverySchedules || [];
  }, [customers, orderForm.customerId]);
  const currentSubtotal = subtotalFor(currentKg, settings.pricePerKg);
  const currentTotal = currentSubtotal - Number(orderForm.discount || 0) + Number(orderForm.extraCharge || 0);
  const currentPending = Math.max(currentTotal - Number(orderForm.amountPaid || 0), 0);

  const resetCustomer = () => {
    setCustomerForm(emptyCustomer);
    setEditingCustomerId(null);
  };

  const resetOrder = () => {
    setOrderForm(emptyOrder);
    setEditingOrderId(null);
  };

  const addAuditEntry = (action, detail, changes = []) => {
    setAuditLog((prev) => [
      {
        id: Date.now() + Math.random(),
        action,
        detail,
        changes,
        username: sessionUser?.username || "Sin sesion",
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const changeLogin = (field, value) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    if (loginError) setLoginError("");
  };

  const submitLogin = () => {
    const username = loginForm.username.trim();
    const password = loginForm.password;
    const matchedUser = USERS.find(
      (user) => user.username === username && user.password === password
    );

    if (!matchedUser) {
      setLoginError("Usuario o contrasena incorrectos.");
      return;
    }

    setSessionUser({ username: matchedUser.username });
    setAuditLog((prev) => [
      {
        id: Date.now() + Math.random(),
        action: "Inicio de sesion",
        detail: `${matchedUser.username} ingreso a la aplicacion.`,
        username: matchedUser.username,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setLoginForm({ username: "", password: "" });
    setLoginError("");
  };

  const logout = () => {
    setSessionUser(null);
    setLoginForm({ username: "", password: "" });
    setLoginError("");
  };

  const savePricePerKg = () => {
    const nextPrice = Number(priceInput || 0);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      window.alert("Ingresa un precio valido mayor a 0.");
      return;
    }

    const previousSettings = settings;
    const nextSettings = { ...settings, pricePerKg: nextPrice };
    setSettings(nextSettings);
    addAuditEntry(
      "Precio actualizado",
      `Se actualizo el precio del kilo de pan a ${currency(nextPrice)}.`,
      collectChanges(previousSettings, nextSettings, settingsFieldLabels)
    );
  };

  const changeOrder = (field, value) => {
    setOrderForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "customerType" && value === FIXED) {
        next.useDefaultDailyKg = true;
      }
      if (field === "customerType" && value !== FIXED) {
        next.defaultDailyBreadKg = "";
        next.useDefaultDailyKg = false;
      }
      if (field === "defaultDailyBreadKg" && next.customerType === FIXED && next.useDefaultDailyKg) next.breadKg = value;
      return next;
    });
  };

  const changeBreadKg = (type, value) => {
    setOrderForm((prev) => ({
      ...prev,
      orderBreadKg: {
        ...prev.orderBreadKg,
        [type]: value,
      },
    }));
  };

  const updateCustomerSchedule = (index, updater) => {
    setCustomerForm((prev) => {
      const nextSchedules = prev.deliverySchedules.map((schedule, scheduleIndex) => {
        if (scheduleIndex !== index) return schedule;
        const updatedSchedule = updater(schedule);
        return normalizeDeliverySchedule(updatedSchedule);
      });
      const firstSchedule = nextSchedules[0] || createDeliverySchedule();

      return {
        ...prev,
        deliveryTime: firstSchedule.deliveryTime,
        deliveryAddress: firstSchedule.deliveryAddress,
        defaultDailyBreadMap: firstSchedule.breadMap,
        defaultDailyOrderItems: firstSchedule.orderItems,
        defaultDailyBreadKg:
          prev.customerType === FIXED ? String(totalBreadFromSchedules(nextSchedules) || "") : "",
        deliverySchedules: nextSchedules,
        deliverySchedulesSummary: customerSchedulesSummary(nextSchedules),
      };
    });
  };

  const changeCustomerBreadKg = (index, type, value) => {
    updateCustomerSchedule(index, (schedule) => ({
      ...schedule,
      breadMap: {
        ...schedule.breadMap,
        [type]: value,
      },
    }));
  };

  const changeCustomerScheduleField = (index, field, value) => {
    updateCustomerSchedule(index, (schedule) => ({
      ...schedule,
      [field]: field === "deliveryAddress" && index > 0 ? schedule.deliveryAddress : value,
    }));
  };

  const addCustomerSchedule = () => {
    setCustomerForm((prev) => {
      const nextSchedules = [...prev.deliverySchedules, createDeliverySchedule()];
      return {
        ...prev,
        deliverySchedules: nextSchedules,
        deliverySchedulesSummary: customerSchedulesSummary(nextSchedules),
      };
    });
  };

  const removeCustomerSchedule = (index) => {
    setCustomerForm((prev) => {
      const nextSchedules =
        prev.deliverySchedules.length === 1
          ? [createDeliverySchedule()]
          : prev.deliverySchedules.filter((_, scheduleIndex) => scheduleIndex !== index);
      const firstSchedule = nextSchedules[0] || createDeliverySchedule();

      return {
        ...prev,
        deliveryTime: firstSchedule.deliveryTime,
        deliveryAddress: firstSchedule.deliveryAddress,
        defaultDailyBreadMap: firstSchedule.breadMap,
        defaultDailyOrderItems: firstSchedule.orderItems,
        defaultDailyBreadKg:
          prev.customerType === FIXED ? String(totalBreadFromSchedules(nextSchedules) || "") : "",
        deliverySchedules: nextSchedules,
        deliverySchedulesSummary: customerSchedulesSummary(nextSchedules),
      };
    });
  };

  const selectCustomer = (id) => {
    const customer = customers.find((item) => String(item.id) === String(id));
    if (!customer) return;
    setOrderForm((prev) => ({
      ...prev,
      customerId: String(customer.id),
      customerScheduleId: customer.deliverySchedules?.[0]?.id || "",
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryTime: customer.deliverySchedules?.[0]?.deliveryTime || customer.deliveryTime || "",
      deliveryAddress: customer.deliverySchedules?.[0]?.deliveryAddress || customer.deliveryAddress || "",
      customerType: customer.customerType,
      defaultDailyBreadKg: customer.deliverySchedules?.[0]?.breadKg ? String(customer.deliverySchedules[0].breadKg) : customer.defaultDailyBreadKg ? String(customer.defaultDailyBreadKg) : "",
      useDefaultDailyKg: customer.customerType === FIXED,
      orderBreadKg:
        customer.customerType === FIXED
          ? BREAD_TYPES.reduce((acc, type) => ({
              ...acc,
              [type]: customer.deliverySchedules?.[0]?.breadMap?.[type] ?? customer.defaultDailyBreadMap?.[type] ?? "",
            }), {})
          : prev.orderBreadKg,
      breadKg:
        customer.customerType === FIXED && Number(customer.deliverySchedules?.[0]?.breadKg || customer.defaultDailyBreadKg || 0) > 0
          ? String(customer.deliverySchedules?.[0]?.breadKg || customer.defaultDailyBreadKg)
          : prev.breadKg,
      orderItems: customer.customerType === FIXED ? customer.deliverySchedules?.[0]?.orderItems || customer.defaultDailyOrderItems || "" : prev.orderItems,
    }));
  };

  const applyCustomerScheduleToOrder = (scheduleId) => {
    const customer = customers.find((item) => String(item.id) === String(orderForm.customerId));
    const schedule = customer?.deliverySchedules?.find((item) => item.id === scheduleId);
    if (!customer || !schedule) return;

    setOrderForm((prev) => ({
      ...prev,
      customerScheduleId: schedule.id,
      deliveryTime: schedule.deliveryTime,
      deliveryAddress: schedule.deliveryAddress,
      defaultDailyBreadKg: String(schedule.breadKg || ""),
      orderBreadKg: BREAD_TYPES.reduce((acc, type) => ({
        ...acc,
        [type]: schedule.breadMap?.[type] ?? "",
      }), {}),
      breadKg: String(schedule.breadKg || ""),
      orderItems: schedule.orderItems || "",
    }));
  };

  const saveCustomer = () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return window.alert("Completa nombre y telefono.");
    const deliverySchedules = customerForm.deliverySchedules.map((schedule, index) =>
      normalizeDeliverySchedule({
        ...schedule,
        deliveryAddress: index === 0 ? schedule.deliveryAddress : "",
      })
    );
    const firstSchedule = deliverySchedules[0] || createDeliverySchedule();
    if (
      customerForm.customerType === FIXED &&
      deliverySchedules.some((schedule) => Number(schedule.breadKg || 0) <= 0)
    ) {
      return window.alert("Ingresa al menos una variedad diaria con kilos para el cliente fijo.");
    }
    const payload = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      deliveryTime: firstSchedule.deliveryTime,
      deliveryAddress: firstSchedule.deliveryAddress.trim(),
      customerType: customerForm.customerType,
      defaultDailyBreadKg: customerForm.customerType === FIXED ? totalBreadFromSchedules(deliverySchedules) : 0,
      defaultDailyOrderItems: customerForm.customerType === FIXED ? firstSchedule.orderItems : "",
      defaultDailyBreadMap: customerForm.customerType === FIXED ? { ...firstSchedule.breadMap } : createEmptyBreadKgMap(),
      deliverySchedules: customerForm.customerType === FIXED ? deliverySchedules : [normalizeDeliverySchedule(firstSchedule)],
      deliverySchedulesSummary: customerSchedulesSummary(
        customerForm.customerType === FIXED ? deliverySchedules : [normalizeDeliverySchedule(firstSchedule)]
      ),
      notes: customerForm.notes.trim(),
    };
    const normalizedPayload = normalizeCustomerRecord(payload);
    if (editingCustomerId) {
      setCustomers((prev) => prev.map((c) => (c.id === editingCustomerId ? { ...normalizedPayload, id: editingCustomerId } : c)));
      setOrders((prev) => prev.map((o) => (
        o.customerId === editingCustomerId
          ? {
              ...o,
              customerName: normalizedPayload.name,
              customerPhone: normalizedPayload.phone,
              deliveryTime: normalizedPayload.deliveryTime,
              deliveryAddress: normalizedPayload.deliveryAddress,
              customerType: normalizedPayload.customerType,
              defaultDailyBreadKg: normalizedPayload.defaultDailyBreadKg,
            }
          : o
      )));
      const previousCustomer = customers.find((customer) => customer.id === editingCustomerId);
      addAuditEntry(
        "Cliente editado",
        `Se actualizo el cliente ${normalizedPayload.name}.`,
        collectChanges(previousCustomer, normalizedPayload, customerFieldLabels)
      );
    } else {
      setCustomers((prev) => [{ ...normalizedPayload, id: Date.now() }, ...prev]);
      addAuditEntry(
        "Cliente creado",
        `Se creo el cliente ${normalizedPayload.name}.`,
        Object.entries(customerFieldLabels).map(([field, label]) => `${label}: ${textValue(normalizedPayload[field])}`)
      );
    }
    resetCustomer();
    setCustomerModal(false);
  };

  const saveOrder = () => {
    const orderItems = buildOrderSummary(orderForm.orderBreadKg);
    const totalSelectedKg = totalBreadFromVarieties(orderForm.orderBreadKg);
    if (!orderForm.customerName.trim() || !orderForm.customerPhone.trim()) {
      return window.alert("Completa cliente y telefono.");
    }
    if (!orderItems && !(orderForm.customerType === FIXED && Number(orderForm.defaultDailyBreadKg || 0) > 0 && orderForm.useDefaultDailyKg)) {
      return window.alert("Ingresa al menos una variedad de pan con kilos.");
    }
    const payload = {
      ...orderForm,
      customerId: orderForm.customerId ? Number(orderForm.customerId) : null,
      customerName: orderForm.customerName.trim(),
      customerPhone: orderForm.customerPhone.trim(),
      deliveryTime: orderForm.deliveryTime,
      deliveryAddress: orderForm.deliveryAddress.trim(),
      orderItems,
      orderBreadKg: { ...orderForm.orderBreadKg },
      defaultDailyBreadKg: Number(orderForm.defaultDailyBreadKg || 0),
      breadKg: totalSelectedKg || effectiveKg(orderForm),
      discount: Number(orderForm.discount || 0),
      extraCharge: Number(orderForm.extraCharge || 0),
      amountPaid: Number(orderForm.amountPaid || 0),
      paymentComment: orderForm.paymentComment?.trim?.() || "",
      modifications: orderForm.modifications.trim(),
      notes: orderForm.notes.trim(),
      customerDeleted: false,
    };
    if (editingOrderId) {
      const previousOrder = orders.find((order) => order.id === editingOrderId);
      setOrders((prev) => prev.map((o) => (o.id === editingOrderId ? { ...payload, id: editingOrderId, customerDeleted: o.customerDeleted ?? false } : o)));
      addAuditEntry(
        "Registro editado",
        `Se actualizo el pedido de ${payload.customerName} para ${payload.deliveryDate || "sin fecha"}.`,
        collectChanges(previousOrder, payload, orderFieldLabels)
      );
    } else {
      setOrders((prev) => [{ ...payload, id: Date.now() }, ...prev]);
      addAuditEntry(
        "Registro creado",
        `Se creo un pedido para ${payload.customerName} con entrega ${payload.deliveryDate || "sin fecha"}.`,
        Object.entries(orderFieldLabels).map(([field, label]) => `${label}: ${textValue(payload[field])}`)
      );
    }
    resetOrder();
    setOrderModal(false);
  };

  const editCustomer = (customer) => {
    const deliverySchedules = ensureCustomerSchedules(customer);
    const firstSchedule = deliverySchedules[0] || createDeliverySchedule();
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      deliveryTime: firstSchedule.deliveryTime || "",
      deliveryAddress: firstSchedule.deliveryAddress || "",
      customerType: customer.customerType,
      defaultDailyBreadKg: totalBreadFromSchedules(deliverySchedules) ? String(totalBreadFromSchedules(deliverySchedules)) : "",
      defaultDailyOrderItems: firstSchedule.orderItems || "",
      defaultDailyBreadMap: { ...firstSchedule.breadMap },
      deliverySchedules,
      deliverySchedulesSummary: customerSchedulesSummary(deliverySchedules),
      notes: customer.notes || "",
    });
    setEditingCustomerId(customer.id);
    setCustomerModal(true);
  };

  const editOrder = (order) => {
    setOrderForm({
      ...order,
      customerId: order.customerDeleted ? "" : order.customerId ? String(order.customerId) : "",
      customerScheduleId: order.customerScheduleId || "",
      deliveryTime: order.deliveryTime || "",
      deliveryAddress: order.deliveryAddress || "",
      orderBreadKg: BREAD_TYPES.reduce((acc, type) => ({
        ...acc,
        [type]: order.orderBreadKg?.[type] ?? "",
      }), {}),
      defaultDailyBreadKg: String(order.defaultDailyBreadKg ?? ""),
      breadKg: String(order.breadKg ?? ""),
      discount: String(order.discount ?? 0),
      extraCharge: String(order.extraCharge ?? 0),
      amountPaid: String(order.amountPaid ?? 0),
      paymentComment: order.paymentComment ?? "",
      useDefaultDailyKg: Boolean(order.useDefaultDailyKg),
    });
    setEditingOrderId(order.id);
    setOrderModal(true);
  };

  const removeCustomer = (id) => {
    const customer = customers.find((item) => item.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setOrders((prev) => prev.map((o) => (o.customerId === id ? { ...o, customerId: null, customerDeleted: true } : o)));
    if (customer) {
      addAuditEntry(
        "Cliente eliminado",
        `Se elimino el cliente ${customer.name}.`,
        Object.entries(customerFieldLabels).map(([field, label]) => `${label}: ${textValue(customer[field])}`)
      );
    }
  };

  const removeOrder = (id) => {
    const order = orders.find((item) => item.id === id);
    setOrders((prev) => prev.filter((item) => item.id !== id));
    if (order) {
      addAuditEntry(
        "Registro eliminado",
        `Se elimino el pedido de ${order.customerName} con fecha ${order.deliveryDate || "sin fecha"}.`,
        Object.entries(orderFieldLabels).map(([field, label]) => `${label}: ${textValue(order[field])}`)
      );
    }
  };

  const markPaid = (id) => {
    const targetOrder = orders.find((order) => order.id === id);
    if (!targetOrder) return;
    if (!window.confirm(`Confirmas marcar como pagado el pedido de ${targetOrder.customerName}?`)) {
      return;
    }

    const paymentComment = window.prompt(
      "Comentario de pago (opcional):",
      targetOrder.paymentComment || ""
    );
    if (paymentComment === null) return;

    let updated = null;
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o;
      const c = computeOrder(o, settings.pricePerKg);
      updated = {
        ...o,
        amountPaid: c.computedTotal,
        paymentStatus: "Pagado",
        paymentComment: paymentComment.trim(),
      };
      return updated;
    }));
    if (updated) {
      addAuditEntry(
        "Pago marcado",
        `Se marco como pagado el pedido de ${updated.customerName}.`,
        collectChanges(targetOrder, updated, {
          paymentStatus: "Estado de pago",
          amountPaid: "Monto pagado",
          paymentComment: "Comentario de pago",
        })
      );
      openWhatsapp(
        updated.customerPhone,
        paidMessage({ ...updated, pricePerKg: settings.pricePerKg })
      );
    }
  };

  const markUnpaid = (id) => {
    const targetOrder = orders.find((order) => order.id === id);
    if (!targetOrder) return;
    if (!window.confirm(`Confirmas volver a dejar como no pagado el pedido de ${targetOrder.customerName}?`)) {
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, paymentStatus: "Pendiente", amountPaid: 0, paymentComment: "" }
          : order
      )
    );
    addAuditEntry(
      "Pago revertido",
      `Se devolvio a pendiente el pedido de ${targetOrder.customerName}.`,
      collectChanges(targetOrder, { ...targetOrder, paymentStatus: "Pendiente", amountPaid: 0, paymentComment: "" }, {
        paymentStatus: "Estado de pago",
        amountPaid: "Monto pagado",
        paymentComment: "Comentario de pago",
      })
    );
  };

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      window.alert("Mensaje copiado");
    } catch {
      window.alert("No se pudo copiar el mensaje");
    }
  };

  const pendingOrders = useMemo(
    () => computedOrders.filter((order) => order.paymentStatus !== "Pagado"),
    [computedOrders]
  );
  const isOwner = sessionUser?.username === OWNER_USERNAME;

  if (!sessionUser?.username) {
    return (
      <LoginScreen
        loginForm={loginForm}
        loginError={loginError}
        onChange={changeLogin}
        onSubmit={submitLogin}
      />
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Casa Bravo</p>
            <h1>Gestion completa de pedidos y clientes</h1>
            <p className="lead">Registra clientes, controla pagos, arma mensajes de WhatsApp y guarda todo en el navegador.</p>
          </div>
          <div className="hero-side">
            <div className="hero-surface">
              <Badge tone="outline">Usuario: {sessionUser.username}</Badge>
              <p className="hero-kicker">Resumen rapido</p>
              <div className="hero-mini-stats">
                <div>
                  <span>Pendientes</span>
                  <strong>{summary.pendingPayments}</strong>
                </div>
                <div>
                  <span>Cobrado</span>
                  <strong>{currency(summary.totalCollected)}</strong>
                </div>
              </div>
            </div>
            <div className="actions wrap quick-actions">
              <button className="btn alt" onClick={() => { resetCustomer(); setCustomerModal(true); }}>Nuevo cliente</button>
              <button className="btn" onClick={() => { resetOrder(); setOrderModal(true); }}>Nuevo registro</button>
              <button className="btn alt" onClick={logout}>Cerrar sesion</button>
            </div>
          </div>
        </header>

        <section className="panel sync-panel">
          <div className="row between start">
            <div className="section-heading compact">
              <p className="section-kicker">Sincronizacion</p>
              <h2>{remoteEnabled ? "Base de datos compartida" : "Base de datos pendiente"}</h2>
              <p className="lead">
                {remoteEnabled
                  ? syncStatus
                  : "La app sigue funcionando, pero todavia esta guardando la informacion solo en este dispositivo. Configura Supabase para compartir clientes, pedidos e historial entre todos."}
              </p>
              {syncError ? <p className="login-error">{syncError}</p> : null}
            </div>
            <div className="actions wrap">
              <Badge tone="outline">{remoteEnabled ? "Compartido" : "Solo local"}</Badge>
              {lastSyncedAt ? (
                <Badge tone="outline">Ultima sync: {formatTimestamp(lastSyncedAt)}</Badge>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="row between start">
            <div className="section-heading compact">
              <p className="section-kicker">Configuracion</p>
              <h2>Precio del kilo</h2>
              <p className="lead">Valor compartido en toda la aplicacion: {currency(settings.pricePerKg)}</p>
            </div>
            {isOwner ? (
              <div className="price-editor">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                />
                <button className="btn" onClick={savePricePerKg} type="button">Guardar precio</button>
              </div>
            ) : (
              <Badge tone="outline">Solo el propietario puede cambiarlo</Badge>
            )}
          </div>
        </section>

        <section className="stats">
          <Stat label="Registros" value={summary.totalOrders} />
          <Stat label="Clientes" value={summary.totalCustomers} />
          <Stat label="Clientes fijos" value={summary.fixedClients} />
          <Stat label="Cobrado" value={currency(summary.totalCollected)} />
          <Stat label="Pendientes" value={summary.pendingPayments} />
        </section>

        <div className="tabs">
          {[...["customers", "orders", "messages", "pending"], ...(isOwner ? ["history"] : [])].map((name) => (
            <button key={name} className={`btn tab ${tab === name ? "active" : "alt"}`} onClick={() => setTab(name)}>
              {name === "customers" ? "Clientes" : name === "orders" ? "Registros" : name === "messages" ? "Mensajes" : name === "pending" ? "Pendientes" : "Historial"}
            </button>
          ))}
        </div>

        {tab === "customers" && (
          <section className="panel">
            <div className="row between">
              <div className="section-heading">
                <p className="section-kicker">Clientes</p>
                <h2>Listado de clientes</h2>
              </div>
              <input className="search" placeholder="Buscar por nombre, telefono o tipo" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            </div>
            <div className="list">
              {filteredCustomers.length === 0 ? <div className="empty">No se encontraron clientes.</div> : filteredCustomers.map((customer) => (
                <article className="card" key={customer.id}>
                  <div className="row between start card-head">
                    <div className="info-stack">
                      <h3>{customer.name}</h3>
                      <p className="muted">{customer.phone}</p>
                    </div>
                    <div className="actions wrap">
                      <button className="btn alt" onClick={() => editCustomer(customer)}>Editar</button>
                      <button className="btn danger" onClick={() => removeCustomer(customer.id)}>Eliminar</button>
                    </div>
                  </div>
                  <div className="badges">
                    <Badge>{customer.customerType}</Badge>
                    {customer.customerType === FIXED && Number(customer.defaultDailyBreadKg || 0) > 0 ? <Badge tone="outline">Total: {customer.defaultDailyBreadKg} kg diarios</Badge> : null}
                  </div>
                  {customer.deliverySchedules?.length ? (
                    <div className="schedule-list">
                      {customer.deliverySchedules.map((schedule, index) => (
                        <div className="schedule-summary" key={schedule.id}>
                          <p className="card-section-title">Horario {index + 1}</p>
                          {schedule.deliveryTime ? <p className="muted">Horario: {schedule.deliveryTime}</p> : null}
                          {index === 0 && schedule.deliveryAddress ? (
                            <p className="muted">
                              Direccion:{" "}
                              <a className="map-link" href={mapsLinkFor(schedule.deliveryAddress)} target="_blank" rel="noreferrer">
                                {schedule.deliveryAddress}
                              </a>
                            </p>
                          ) : null}
                          {schedule.orderItems ? <p className="muted">Variedad diaria: {schedule.orderItems}</p> : null}
                          {schedule.breadKg ? <p className="muted">Kg diarios: {schedule.breadKg}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {customer.notes ? <p className="muted">{customer.notes}</p> : null}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="panel">
            <div className="row between">
              <div className="section-heading">
                <p className="section-kicker">Pedidos</p>
                <h2>Listado de registros</h2>
              </div>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div className="list">
              {filteredOrders.length === 0 ? <div className="empty">No hay registros para la fecha seleccionada.</div> : filteredOrders.map((order) => (
                <article className="card" key={order.id}>
                  <div className="row between start card-head">
                    <div className="info-stack">
                      <h3>{order.customerName}</h3>
                      <p className="muted">{order.customerPhone}</p>
                      {order.deliveryTime ? <p className="muted">Horario: {order.deliveryTime}</p> : null}
                      {order.deliveryAddress ? (
                        <p className="muted">
                          Direccion:{" "}
                          <a className="map-link" href={mapsLinkFor(order.deliveryAddress)} target="_blank" rel="noreferrer">
                            {order.deliveryAddress}
                          </a>
                        </p>
                      ) : null}
                    </div>
                    <div className="actions wrap">
                      <button className="btn alt" onClick={() => editOrder(order)}>Editar</button>
                      <button className="btn danger" onClick={() => removeOrder(order.id)}>Eliminar</button>
                    </div>
                  </div>
                  <div className="badges">
                    <Badge>{order.customerType}</Badge>
                    <Badge tone="outline">Pago: {order.paymentStatus}</Badge>
                    <Badge tone="outline">Fecha: {order.deliveryDate || "sin fecha"}</Badge>
                    <Badge tone="outline">{order.paymentMethod}</Badge>
                    {order.customerDeleted ? <Badge tone="danger">Cliente eliminado</Badge> : null}
                  </div>
                  <p className="order-highlight">{order.orderItems}</p>
                  {order.customerType === FIXED && Number(order.defaultDailyBreadKg || 0) > 0 ? <p className="muted">Cantidad diaria registrada: {Number(order.defaultDailyBreadKg || 0)} kg</p> : null}
                  {order.modifications ? <p className="muted">Modificaciones: {order.modifications}</p> : null}
                  {order.notes ? <p className="muted">Notas: {order.notes}</p> : null}
                  <div className="summary">
                    <span>Pan aplicado</span><strong>{order.computedBreadKg} kg</strong>
                    <span>Subtotal</span><strong>{currency(order.computedSubtotal)}</strong>
                    <span>Descuento</span><strong>{currency(order.discount)}</strong>
                    <span>Ajustes</span><strong>{currency(order.extraCharge)}</strong>
                    <span>Pagado</span><strong>{currency(order.amountPaid)}</strong>
                    <span>Total</span><strong>{currency(order.computedTotal)}</strong>
                    <span>Saldo</span><strong>{currency(order.computedPending)}</strong>
                  </div>
                  <div className="actions wrap">
                    <button className="btn" onClick={() => openWhatsapp(order.customerPhone, whatsappMessageFor(order))}>WhatsApp</button>
                    <button className="btn alt" onClick={() => copyMessage(whatsappMessageFor(order))}>Copiar</button>
                    {order.paymentStatus !== "Pagado" ? (
                      <button className="btn alt" onClick={() => markPaid(order.id)}>Marcar pagado</button>
                    ) : (
                      <button className="btn alt" onClick={() => markUnpaid(order.id)}>Volver a no pagado</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "messages" && (
          <section className="panel">
            <div className="row between">
              <div className="section-heading">
                <p className="section-kicker">Mensajes</p>
                <h2>Vista previa de mensajes</h2>
              </div>
            </div>
            <div className="list">
              {computedOrders.map((order) => (
                <article className="card" key={order.id}>
                  <h3>{order.customerName}</h3>
                  <pre className="pre">{whatsappMessageFor(order)}</pre>
                  {order.paymentStatus === "Pagado" ? <><hr /><p className="muted">Confirmacion de pago</p><pre className="pre">{paidMessage(order)}</pre></> : null}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "pending" && (
          <section className="panel">
            <div className="row between">
              <div className="section-heading">
                <p className="section-kicker">Cobros</p>
                <h2>Pendientes</h2>
              </div>
            </div>
            <div className="list">
              {pendingOrders.length === 0 ? (
                <div className="empty">No hay clientes con pagos pendientes.</div>
              ) : (
                pendingOrders.map((order) => (
                  <article className="card" key={order.id}>
                    <div className="row between start card-head">
                      <div className="info-stack">
                        <h3>{order.customerName}</h3>
                        <p className="muted">{order.customerPhone}</p>
                        {order.deliveryTime ? <p className="muted">Horario: {order.deliveryTime}</p> : null}
                        {order.deliveryAddress ? (
                          <p className="muted">
                            Direccion:{" "}
                            <a className="map-link" href={mapsLinkFor(order.deliveryAddress)} target="_blank" rel="noreferrer">
                              {order.deliveryAddress}
                            </a>
                          </p>
                        ) : null}
                      </div>
                      <Badge tone="outline">Saldo: {currency(order.computedPending)}</Badge>
                    </div>
                    <p>{order.orderItems}</p>
                    <div className="badges">
                      <Badge>{order.customerType}</Badge>
                      <Badge tone="outline">Fecha: {order.deliveryDate || "sin fecha"}</Badge>
                      <Badge tone="outline">Pago: Pendiente</Badge>
                    </div>
                    <div className="summary">
                      <span>Total</span><strong>{currency(order.computedTotal)}</strong>
                      <span>Pagado</span><strong>{currency(order.amountPaid)}</strong>
                      <span>Saldo</span><strong>{currency(order.computedPending)}</strong>
                    </div>
                    <div className="actions wrap">
                      <button className="btn" onClick={() => openWhatsapp(order.customerPhone, whatsappMessageFor(order))}>WhatsApp</button>
                      <button className="btn alt" onClick={() => copyMessage(whatsappMessageFor(order))}>Copiar</button>
                      <button className="btn alt" onClick={() => markPaid(order.id)}>Marcar pagado</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "history" && isOwner && (
          <section className="panel">
            <div className="row between">
              <div className="section-heading">
                <p className="section-kicker">Propietario</p>
                <h2>Historial de cambios</h2>
              </div>
              <Badge tone="outline">{auditLog.length} movimientos</Badge>
            </div>
            <div className="list">
              {auditLog.length === 0 ? (
                <div className="empty">Aun no hay cambios registrados.</div>
              ) : (
                auditLog.map((entry) => (
                  <article className="card audit-card" key={entry.id}>
                    <div className="row between start">
                      <div>
                        <h3>{entry.action}</h3>
                        <p className="muted">{entry.detail}</p>
                      </div>
                      <Badge tone="outline">{entry.username}</Badge>
                    </div>
                    {entry.changes?.length ? (
                      <div className="audit-changes">
                        {entry.changes.map((change, index) => (
                          <p className="audit-change" key={`${entry.id}-${index}`}>{change}</p>
                        ))}
                      </div>
                    ) : null}
                    <p className="audit-date">{formatTimestamp(entry.createdAt)}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        <Modal open={customerModal} title={editingCustomerId ? "Editar cliente" : "Nuevo cliente"} onClose={() => setCustomerModal(false)}>
          <div className="form">
            <label><span>Nombre</span><input value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} /></label>
            <label><span>Telefono</span><input value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} /></label>
            <label><span>Tipo de cliente</span><select value={customerForm.customerType} onChange={(e) => setCustomerForm((p) => ({ ...p, customerType: e.target.value, defaultDailyBreadKg: e.target.value === FIXED ? p.defaultDailyBreadKg : "", defaultDailyOrderItems: e.target.value === FIXED ? p.defaultDailyOrderItems : "", defaultDailyBreadMap: e.target.value === FIXED ? p.defaultDailyBreadMap : createEmptyBreadKgMap(), deliverySchedules: e.target.value === FIXED ? p.deliverySchedules : [normalizeDeliverySchedule(p.deliverySchedules[0] || createDeliverySchedule())] }))}><option value={OCCASIONAL}>{OCCASIONAL}</option><option value={FIXED}>{FIXED}</option></select></label>
            <label><span>Cantidad diaria (kg)</span><input type="number" min="0" step="0.1" readOnly disabled value={customerForm.customerType === FIXED ? customerForm.defaultDailyBreadKg : ""} /></label>
            <div className="full schedule-editor-wrap">
              <div className="row between start">
                <span>Horarios de entrega del cliente</span>
                <button className="btn alt" type="button" onClick={addCustomerSchedule}>Agregar otro horario de entrega</button>
              </div>
              <div className="schedule-editor-list">
                {customerForm.deliverySchedules.map((schedule, index) => (
                  <div className="schedule-editor" key={schedule.id}>
                    <div className="row between start">
                      <strong>Horario {index + 1}</strong>
                      <button className="btn danger" type="button" onClick={() => removeCustomerSchedule(index)}>Quitar</button>
                    </div>
                    <div className="form schedule-form">
                      <label><span>Horario de entrega</span><input type="time" value={schedule.deliveryTime} onChange={(e) => changeCustomerScheduleField(index, "deliveryTime", e.target.value)} /></label>
                      {index === 0 ? (
                        <label><span>Direccion de entrega</span><input value={schedule.deliveryAddress} onChange={(e) => changeCustomerScheduleField(index, "deliveryAddress", e.target.value)} /></label>
                      ) : null}
                      <label><span>Cantidad diaria (kg)</span><input type="number" min="0" step="0.1" readOnly disabled value={customerForm.customerType === FIXED ? schedule.breadKg : ""} /></label>
                    </div>
                    <div className="bread-grid-wrap">
                      <span>Variedad diaria del cliente para este horario</span>
                      <div className="bread-grid">
                        {BREAD_TYPES.map((type) => (
                          <label key={`${schedule.id}-${type}`} className="bread-item">
                            <span>{type}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              disabled={customerForm.customerType !== FIXED}
                              value={schedule.breadMap[type]}
                              onChange={(e) => changeCustomerBreadKg(index, type, e.target.value)}
                              placeholder="Kg"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <label className="full"><span>Notas</span><textarea rows="3" value={customerForm.notes} onChange={(e) => setCustomerForm((p) => ({ ...p, notes: e.target.value }))} /></label>
          </div>
          <div className="row end"><button className="btn alt" onClick={() => setCustomerModal(false)}>Cancelar</button><button className="btn" onClick={saveCustomer}>{editingCustomerId ? "Guardar cambios" : "Crear cliente"}</button></div>
        </Modal>

        <Modal open={orderModal} title={editingOrderId ? "Editar registro" : "Nuevo registro"} onClose={() => setOrderModal(false)}>
          <div className="form">
            <label className="full"><span>Seleccionar cliente</span><select value={orderForm.customerId} onChange={(e) => selectCustomer(e.target.value)}><option value="">Cliente manual</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
            {selectedCustomerSchedules.length > 0 ? (
              <label className="full">
                <span>Horario guardado del cliente</span>
                <select value={orderForm.customerScheduleId} onChange={(e) => applyCustomerScheduleToOrder(e.target.value)}>
                  {selectedCustomerSchedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.deliveryTime || "Sin hora"} - {schedule.orderItems || "Sin variedad"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label><span>Nombre cliente</span><input value={orderForm.customerName} onChange={(e) => changeOrder("customerName", e.target.value)} /></label>
            <label><span>Telefono</span><input value={orderForm.customerPhone} onChange={(e) => changeOrder("customerPhone", e.target.value)} /></label>
            <label><span>Horario de entrega</span><input type="time" value={orderForm.deliveryTime} onChange={(e) => changeOrder("deliveryTime", e.target.value)} /></label>
            <label><span>Direccion de entrega</span><input value={orderForm.deliveryAddress} onChange={(e) => changeOrder("deliveryAddress", e.target.value)} /></label>
            <label><span>Tipo de cliente</span><select value={orderForm.customerType} onChange={(e) => changeOrder("customerType", e.target.value)}><option value={OCCASIONAL}>{OCCASIONAL}</option><option value={FIXED}>{FIXED}</option></select></label>
            <label><span>Fecha de entrega</span><input type="date" value={orderForm.deliveryDate} onChange={(e) => changeOrder("deliveryDate", e.target.value)} /></label>
            <label><span>Cantidad diaria registrada</span><input type="number" min="0" step="0.1" disabled={orderForm.customerType !== FIXED} value={orderForm.defaultDailyBreadKg} onChange={(e) => changeOrder("defaultDailyBreadKg", e.target.value)} /></label>
            <label className="checkbox"><span>Usar cantidad diaria</span><input type="checkbox" checked={Boolean(orderForm.useDefaultDailyKg)} disabled={orderForm.customerType !== FIXED} onChange={(e) => changeOrder("useDefaultDailyKg", e.target.checked)} /></label>
            <div className="full bread-grid-wrap">
              <span>Variedades de pan y kilos</span>
              <div className="bread-grid">
                {BREAD_TYPES.map((type) => (
                  <label key={type} className="bread-item">
                    <span>{type}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={orderForm.orderBreadKg[type]}
                      onChange={(e) => changeBreadKg(type, e.target.value)}
                      placeholder="Kg"
                    />
                  </label>
                ))}
              </div>
            </div>
            <label><span>Cantidad de pan (kg)</span><input type="number" min="0" step="0.1" readOnly={orderForm.useDefaultDailyKg && orderForm.customerType === FIXED} value={orderForm.useDefaultDailyKg && orderForm.customerType === FIXED ? currentKg : orderForm.breadKg} onChange={(e) => changeOrder("breadKg", e.target.value)} /></label>
            <label><span>Medio de pago</span><select value={orderForm.paymentMethod} onChange={(e) => changeOrder("paymentMethod", e.target.value)}>{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
            <label><span>Estado pago</span><select value={orderForm.paymentStatus} onChange={(e) => changeOrder("paymentStatus", e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label><span>Comentario de pago</span><input value={orderForm.paymentComment} onChange={(e) => changeOrder("paymentComment", e.target.value)} placeholder="Ej: transferencia recibida, abonado por familiar" /></label>
            <label><span>Descuento</span><input type="number" value={orderForm.discount} onChange={(e) => changeOrder("discount", e.target.value)} /></label>
            <label><span>Ajustes</span><input type="number" value={orderForm.extraCharge} onChange={(e) => changeOrder("extraCharge", e.target.value)} /></label>
            <label><span>Monto pagado</span><input type="number" value={orderForm.amountPaid} onChange={(e) => changeOrder("amountPaid", e.target.value)} /></label>
            <label className="full"><span>Modificaciones</span><textarea rows="3" value={orderForm.modifications} onChange={(e) => changeOrder("modifications", e.target.value)} /></label>
            <label className="full"><span>Notas internas</span><textarea rows="3" value={orderForm.notes} onChange={(e) => changeOrder("notes", e.target.value)} /></label>
          </div>
          <div className="resume">
            <div><p>Kg aplicados</p><strong>{currentKg} kg</strong></div>
            <div><p>Subtotal</p><strong>{currency(currentSubtotal)}</strong></div>
            <div><p>Total</p><strong>{currency(currentTotal)}</strong></div>
            <div><p>Saldo</p><strong>{currency(currentPending)}</strong></div>
          </div>
          <div className="row end"><button className="btn alt" onClick={() => setOrderModal(false)}>Cancelar</button><button className="btn" onClick={saveOrder}>{editingOrderId ? "Guardar cambios" : "Crear registro"}</button></div>
        </Modal>
      </div>
    </div>
  );
}
